// backend/routes/approval.js - Atualizado com novos estados

const express = require('express');
const { Campaign, Piece, User, Client, CampaignClient } = require('../models');
const { authenticateClient } = require('./clientAuth');
const router = express.Router();

// Middleware para verificar se é usuário Suno
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Usuário não autenticado.' });
}

/* ========== ROTAS PARA VISUALIZAÇÃO E APROVAÇÃO (PÚBLICO/CLIENTE) ========== */

// VISUALIZAR CAMPANHA PARA APROVAÇÃO (via hash - público)
router.get('/campaigns/review/:hash', async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        approvalHash: req.params.hash,
        status: ['sent_for_approval', 'in_review', 'needs_changes']
      },
      include: [
        {
          model: Piece,
          where: { status: ['pending', 'approved', 'needs_adjustment', 'critical_points'] },
          attributes: ['id', 'filename', 'originalName', 'mimetype', 'size', 'status', 'comment', 'reviewedAt', 'createdAt'],
          required: false
        }
      ],
      attributes: ['id', 'name', 'client', 'creativeLine', 'sentForApprovalAt', 'status']
    });

    if (!campaign) {
      return res.status(404).json({ 
        error: 'Campanha não encontrada ou não disponível para aprovação' 
      });
    }

    // Marcar como em revisão se ainda estiver como "enviada para aprovação"
    if (campaign.status === 'sent_for_approval') {
      await campaign.update({ status: 'in_review' });
    }

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        client: campaign.client,
        creativeLine: campaign.creativeLine,
        sentForApprovalAt: campaign.sentForApprovalAt,
        status: 'in_review',
        pieces: campaign.Pieces.map(piece => ({
          id: piece.id,
          filename: piece.filename,
          originalName: piece.originalName,
          mimetype: piece.mimetype,
          size: piece.size,
          status: piece.status,
          comment: piece.comment,
          reviewedAt: piece.reviewedAt,
          createdAt: piece.createdAt,
          downloadUrl: `/campaigns/files/${piece.filename}`,
        })),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// SALVAR APROVAÇÃO (via hash - público)
router.post('/campaigns/review/:hash/submit', async (req, res) => {
  try {
    const { pieces, reviewerInfo } = req.body;

    if (!pieces || !Array.isArray(pieces)) {
      return res.status(400).json({ error: 'Dados das peças são obrigatórios' });
    }

    const campaign = await Campaign.findOne({
      where: { 
        approvalHash: req.params.hash,
        status: ['sent_for_approval', 'in_review', 'needs_changes']
      },
      include: [Piece]
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    // Atualizar status das peças
    let allApproved = true;
    let hasCriticalPoints = false;
    let needsAdjustments = false;

    for (const pieceUpdate of pieces) {
      const piece = await Piece.findOne({ 
        where: { 
          id: pieceUpdate.id, 
          CampaignId: campaign.id 
        } 
      });
      
      if (piece) {
        // Validar status
        const validStatuses = ['approved', 'needs_adjustment', 'critical_points'];
        if (!validStatuses.includes(pieceUpdate.status)) {
          return res.status(400).json({ 
            error: `Status inválido: ${pieceUpdate.status}` 
          });
        }

        await piece.update({
          status: pieceUpdate.status,
          comment: pieceUpdate.comment || '',
          reviewedAt: new Date(),
          // reviewedBy: clientId se tiver autenticação de cliente
        });

        // Contabilizar para status geral
        if (pieceUpdate.status !== 'approved') {
          allApproved = false;
        }
        if (pieceUpdate.status === 'critical_points') {
          hasCriticalPoints = true;
        }
        if (pieceUpdate.status === 'needs_adjustment') {
          needsAdjustments = true;
        }
      }
    }

    // Determinar status geral da campanha
    let campaignStatus = 'approved';
    if (hasCriticalPoints || needsAdjustments) {
      campaignStatus = 'needs_changes';
    } else if (!allApproved) {
      campaignStatus = 'in_review'; // Ainda tem peças pendentes
    }

    // Atualizar campanha
    const updateData = { status: campaignStatus };
    if (campaignStatus === 'approved') {
      updateData.approvedAt = new Date();
    }

    await campaign.update(updateData);

    // Estatísticas para resposta
    const stats = pieces.reduce((acc, piece) => {
      acc[piece.status] = (acc[piece.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Aprovação registrada com sucesso',
      campaignStatus: campaignStatus,
      stats: {
        approved: stats.approved || 0,
        needsAdjustment: stats.needs_adjustment || 0,
        criticalPoints: stats.critical_points || 0,
        total: pieces.length
      }
    });
  } catch (error) {
    console.error('Erro ao salvar aprovação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ========== ROTAS PARA USUÁRIOS SUNO ========== */

// BUSCAR STATUS DE APROVAÇÃO DAS CAMPANHAS
router.get('/campaigns/status', ensureAuthenticated, async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      include: [
        {
          model: Piece,
          attributes: ['id', 'status']
        },
        {
          model: Client,
          as: 'authorizedClients',
          through: { attributes: ['assignedAt', 'clientStatus'] },
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    const campaignsWithStats = campaigns.map(campaign => {
      const pieces = campaign.Pieces || [];
      const stats = pieces.reduce((acc, piece) => {
        acc[piece.status] = (acc[piece.status] || 0) + 1;
        return acc;
      }, {});

      return {
        id: campaign.id,
        name: campaign.name,
        client: campaign.client,
        creativeLine: campaign.creativeLine,
        status: campaign.status,
        totalPieces: pieces.length,
        pieceStats: {
          uploaded: stats.uploaded || 0,
          attached: stats.attached || 0,
          pending: stats.pending || 0,
          approved: stats.approved || 0,
          needsAdjustment: stats.needs_adjustment || 0,
          criticalPoints: stats.critical_points || 0,
        },
        authorizedClients: campaign.authorizedClients,
        sentForApprovalAt: campaign.sentForApprovalAt,
        approvedAt: campaign.approvedAt,
        approvalLink: ['sent_for_approval', 'in_review', 'needs_changes', 'approved'].includes(campaign.status) ? 
          `${process.env.FRONTEND_URL}/client/approval/${campaign.approvalHash}` : null,
      };
    });

    res.json(campaignsWithStats);
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// REENVIAR CAMPANHA (após ajustes)
router.post('/campaigns/:id/resend', ensureAuthenticated, async (req, res) => {
  try {
    const campaignId = req.params.id;

    const campaign = await Campaign.findOne({
      where: { 
        id: campaignId, 
        createdBy: req.user.id,
        status: 'needs_changes'
      },
      include: [Piece]
    });

    if (!campaign) {
      return res.status(404).json({ 
        error: 'Campanha não encontrada ou não pode ser reenviada' 
      });
    }

    // Resetar peças que precisavam de ajuste para 'pending'
    await Piece.update(
      { 
        status: 'pending',
        comment: null,
        reviewedAt: null 
      },
      { 
        where: { 
          CampaignId: campaignId,
          status: ['needs_adjustment', 'critical_points']
        } 
      }
    );

    // Atualizar campanha
    await campaign.update({
      status: 'sent_for_approval',
      sentForApprovalAt: new Date()
    });

    res.json({
      success: true,
      message: 'Campanha reenviada para aprovação',
      approvalLink: `${process.env.FRONTEND_URL}/client/approval/${campaign.approvalHash}`
    });
  } catch (error) {
    console.error('Erro ao reenviar campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;