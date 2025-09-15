// backend/routes/approval.js

const express = require('express');
const { Campaign, Piece, User } = require('../models');
const { authenticateClient } = require('./clientAuth');
const router = express.Router();

// Middleware para verificar se é usuário Suno
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Usuário não autenticado.' });
}

// ROTA PARA USUÁRIOS SUNO: Enviar campanha para aprovação
router.post('/campaigns/:id/send-for-approval', ensureAuthenticated, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await Campaign.findByPk(campaignId, {
      include: [Piece]
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    // Verificar se o usuário pode enviar esta campanha
    if (campaign.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para enviar esta campanha' });
    }

    // Verificar se há peças na campanha
    if (!campaign.Pieces || campaign.Pieces.length === 0) {
      return res.status(400).json({ error: 'Não é possível enviar uma campanha vazia para aprovação' });
    }

    // Atualizar status da campanha
    campaign.status = 'sent_for_approval';
    campaign.sentForApprovalAt = new Date();
    await campaign.save();

    res.json({
      success: true,
      message: 'Campanha enviada para aprovação com sucesso',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        approvalLink: `${process.env.FRONTEND_URL}/client/approval/${campaign.approvalHash}`,
        pieceCount: campaign.Pieces.length,
      },
    });
  } catch (error) {
    console.error('Erro ao enviar campanha para aprovação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTA PÚBLICA: Visualizar campanha para aprovação (via hash)
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
          attributes: ['id', 'filename', 'mimetype', 'status', 'comment', 'createdAt']
        }
      ],
      attributes: ['id', 'name', 'client', 'creativeLine', 'sentForApprovalAt', 'status']
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada ou não disponível para aprovação' });
    }

    // Marcar como em revisão se ainda estiver como "enviada para aprovação"
    if (campaign.status === 'sent_for_approval') {
      campaign.status = 'in_review';
      await campaign.save();
    }

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        client: campaign.client,
        creativeLine: campaign.creativeLine,
        sentForApprovalAt: campaign.sentForApprovalAt,
        status: campaign.status,
        pieces: campaign.Pieces.map(piece => ({
          id: piece.id,
          filename: piece.filename,
          mimetype: piece.mimetype,
          status: piece.status,
          comment: piece.comment,
          createdAt: piece.createdAt,
          downloadUrl: `/campaigns/files/${piece.filename}`,
        })),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar campanha para aprovação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTA PÚBLICA: Salvar aprovação de peças (via hash)
router.post('/campaigns/review/:hash/submit', async (req, res) => {
  try {
    const { pieces, overallComment } = req.body;

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
    let hasChanges = false;

    for (const pieceUpdate of pieces) {
      const piece = await Piece.findOne({ 
        where: { 
          id: pieceUpdate.id, 
          CampaignId: campaign.id 
        } 
      });
      
      if (piece) {
        piece.status = pieceUpdate.status;
        piece.comment = pieceUpdate.comment || '';
        await piece.save();

        if (pieceUpdate.status !== 'approved') {
          allApproved = false;
        }
        if (pieceUpdate.status === 'needs_adjustment') {
          hasChanges = true;
        }
      }
    }

    // Atualizar status geral da campanha
    let campaignStatus = 'approved';
    if (hasChanges) {
      campaignStatus = 'needs_changes';
    } else if (!allApproved) {
      campaignStatus = 'in_review';
    }

    campaign.status = campaignStatus;
    await campaign.save();

    res.json({
      success: true,
      message: 'Aprovação registrada com sucesso',
      campaignStatus: campaignStatus,
    });
  } catch (error) {
    console.error('Erro ao salvar aprovação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ROTA PARA USUÁRIOS SUNO: Buscar campanhas com status de aprovação
router.get('/campaigns/status', ensureAuthenticated, async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      include: [
        {
          model: Piece,
          attributes: ['id', 'status']
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
        status: campaign.status,
        totalPieces: pieces.length,
        approvedPieces: stats.approved || 0,
        needsAdjustment: stats.needs_adjustment || 0,
        rejectedPieces: stats.rejected || 0,
        pendingPieces: stats.pending || 0,
        sentForApprovalAt: campaign.sentForApprovalAt,
        approvalLink: campaign.status !== 'draft' ? 
          `${process.env.FRONTEND_URL}/client/approval/${campaign.approvalHash}` : null,
      };
    });

    res.json(campaignsWithStats);
  } catch (error) {
    console.error('Erro ao buscar status das campanhas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;