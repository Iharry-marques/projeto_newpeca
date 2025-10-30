// backend/routes/approval.js
// *** VERSÃO CORRIGIDA (usa CreativeLine e assume peças locais) ***

const express = require('express');
const { Op } = require('sequelize'); // Importa Op
const { Campaign, Piece, User, Client, CampaignClient, CreativeLine, MasterClient } = require('../models');
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
router.get('/campaigns/review/:hash', async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { 
        approvalHash: req.params.hash,
        // Cliente pode ver campanhas enviadas, em revisão ou que precisam de ajustes
        status: { [Op.in]: ['sent_for_approval', 'in_review', 'needs_changes', 'approved'] }
      },
      include: [
        {
          model: MasterClient, // Inclui a empresa para mostrar o nome
          as: 'masterClient',
          attributes: ['name']
        },
        {
          model: CreativeLine, // 1. Inclui as Linhas Criativas
          as: 'creativeLines',
          attributes: ['id', 'name'], // Pega o nome da linha
          required: false,
          include: {
            model: Piece, // 2. Inclui as Peças DENTRO das Linhas Criativas
            as: 'pieces',
            // Status que o cliente deve ver para revisar
            where: { 
                status: { [Op.in]: ['pending', 'approved', 'needs_adjustment', 'critical_points'] },
                filename: { [Op.not]: null } // *** GARANTE QUE SÓ PEÇAS COM ARQUIVO LOCAL SEJAM MOSTRADAS ***
            },
            attributes: ['id', 'filename', 'originalName', 'mimetype', 'size', 'status', 'comment', 'reviewedAt', 'createdAt', 'driveId', 'order'],
            required: false
          }
        }
      ],
      attributes: ['id', 'name', 'creativeLine', 'sentForApprovalAt', 'status'] // 'creativeLine' é legado
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

    // Junta as peças de todas as linhas criativas em um único array
    const allPieces = (campaign.creativeLines || []).reduce((acc, line) => {
        // Adiciona o nome da linha a cada peça para contexto (opcional)
        const piecesWithLine = (line.pieces || []).map(p => ({
            ...p.toJSON(),
            creativeLineName: line.name
        }));
        return acc.concat(piecesWithLine);
    }, []);

    // Ordena as peças pela ordem definida
    allPieces.sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(a.createdAt) - new Date(b.createdAt));

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        // Usa o nome do MasterClient ou o campo antigo 'client' como fallback
        client: campaign.masterClient?.name || campaign.client,
        creativeLine: campaign.creativeLine, // Legado
        sentForApprovalAt: campaign.sentForApprovalAt,
        status: 'in_review', // Força 'in_review' na exibição da página
        pieces: allPieces.map(piece => ({
          id: piece.id,
          filename: piece.filename,
          originalName: piece.originalName,
          mimetype: piece.mimetype,
          size: piece.size,
          status: piece.status,
          comment: piece.comment,
          reviewedAt: piece.reviewedAt,
          createdAt: piece.createdAt,
          creativeLineName: piece.creativeLineName, // Passa o nome da linha
          // Esta rota é pública e SÓ serve arquivos da pasta /uploads
          downloadUrl: `/campaigns/files/${piece.filename}`,
        })),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar campanha para revisão (Rota GET):', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// SALVAR APROVAÇÃO (via hash - público)
router.post('/campaigns/review/:hash/submit', async (req, res) => {
  try {
    const { pieces } = req.body; 

    if (!pieces || !Array.isArray(pieces)) {
      return res.status(400).json({ error: 'Dados das peças são obrigatórios' });
    }

    const campaign = await Campaign.findOne({
      where: { 
        approvalHash: req.params.hash,
        status: { [Op.in]: ['sent_for_approval', 'in_review', 'needs_changes', 'approved'] } // Pode submeter mesmo se aprovada (para mudar de ideia)
      },
      include: [
        {
          model: CreativeLine,
          as: 'creativeLines',
          attributes: ['id'],
          required: false,
          include: {
            model: Piece,
            as: 'pieces',
            attributes: ['id'],
            required: false
          }
        }
      ]
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada ou não está mais em revisão.' });
    }
    
    // Cria um Set com todos os IDs de peças válidos para esta campanha
    const validPieceIds = new Set(
      (campaign.creativeLines || []).reduce((acc, line) => {
        return acc.concat((line.pieces || []).map(p => p.id));
      }, [])
    );

    let hasCriticalPoints = false;
    let needsAdjustments = false;

    for (const pieceUpdate of pieces) {
      if (!validPieceIds.has(pieceUpdate.id)) {
        console.warn(`Tentativa de atualizar peça ${pieceUpdate.id} que não pertence à campanha ${campaign.id}`);
        continue;
      }
      
      const piece = await Piece.findByPk(pieceUpdate.id);
      
      if (piece) {
        const validStatuses = ['approved', 'needs_adjustment', 'critical_points'];
        if (!validStatuses.includes(pieceUpdate.status)) {
          return res.status(400).json({ error: `Status inválido: ${pieceUpdate.status}` });
        }
        
        if (pieceUpdate.status !== 'approved' && (!pieceUpdate.comment || pieceUpdate.comment.trim() === '')) {
           return res.status(400).json({
             error: `Comentário é obrigatório para peças com status "${pieceUpdate.status}" (Peça: ${piece.originalName})`
           });
        }

        await piece.update({
          status: pieceUpdate.status,
          comment: pieceUpdate.comment || null, // Salva null se vazio
          reviewedAt: new Date(),
        });
      }
    }

    // Após salvar, re-busca todas as peças para definir o status geral
    const allCampaignPieces = await Piece.findAll({
        attributes: ['id', 'status'],
        include: {
            model: CreativeLine,
            as: 'creativeLine',
            where: { CampaignId: campaign.id },
            attributes: [],
            required: true
        }
    });

    // Recalcula o status geral
    let allApproved = true;
    hasCriticalPoints = false;
    needsAdjustments = false;
    let hasPending = false; // Verifica se *ainda* resta alguma pendente

    for (const piece of allCampaignPieces) {
        if (piece.status === 'pending') { // 'pending' é o status inicial
            hasPending = true;
            allApproved = false;
        } else if (piece.status === 'needs_adjustment') {
            needsAdjustments = true;
            allApproved = false;
        } else if (piece.status === 'critical_points') {
            hasCriticalPoints = true;
            allApproved = false;
        }
        // 'approved' não muda nada
    }

    let campaignStatus = campaign.status; // Mantém o status atual por padrão
    
    if (hasPending) {
        campaignStatus = 'in_review'; // Se algo ficou pendente, continua "Em Revisão"
    } else if (hasCriticalPoints || needsAdjustments) {
        campaignStatus = 'needs_changes'; // Se não há pendentes, mas há ajustes
    } else if (allApproved) {
        campaignStatus = 'approved'; // Se tudo foi aprovado
    }

    const updateData = { status: campaignStatus };
    if (campaignStatus === 'approved') {
      updateData.approvedAt = new Date();
    }

    await campaign.update(updateData);

    // Estatísticas para resposta (baseado no que foi *enviado* nesta requisição)
    const stats = pieces.reduce((acc, piece) => {
      const key = piece.status === 'needs_adjustment' ? 'needsAdjustment' :
                  piece.status === 'critical_points' ? 'criticalPoints' : piece.status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Aprovação registrada com sucesso',
      campaignStatus: campaignStatus, // Retorna o status final da campanha
      stats: {
        approved: stats.approved || 0,
        needsAdjustment: stats.needsAdjustment || 0,
        criticalPoints: stats.criticalPoints || 0,
        total: pieces.length
      }
    });
  } catch (error) {
    console.error('Erro ao salvar aprovação (Rota POST):', error);
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
          model: CreativeLine, 
          as: 'creativeLines',
          attributes: ['id'],
          required: false,
          include: {
            model: Piece,
            as: 'pieces',
            attributes: ['id', 'status'],
            required: false,
          }
        },
        {
          model: Client,
          as: 'authorizedClients',
          through: { attributes: ['assignedAt', 'clientStatus'] },
          attributes: ['id', 'name', 'email']
        },
        {
          model: MasterClient, 
          as: 'masterClient',
          attributes: ['name']
        }
      ],
      order: [['updatedAt', 'DESC']]
    });

    const campaignsWithStats = campaigns.map(campaign => {
      const allPieces = (campaign.creativeLines || []).reduce((acc, line) => {
        return acc.concat(line.pieces || []);
      }, []);
      
      const stats = allPieces.reduce((acc, piece) => {
        const key = piece.status === 'needs_adjustment' ? 'needsAdjustment' :
                    piece.status === 'critical_points' ? 'criticalPoints' : piece.status;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      return {
        id: campaign.id,
        name: campaign.name,
        client: campaign.masterClient?.name || campaign.client,
        creativeLine: campaign.creativeLine,
        status: campaign.status,
        totalPieces: allPieces.length,
        pieceStats: {
          uploaded: stats.uploaded || 0, // Status 'uploaded' legado
          attached: stats.attached || 0, // Status 'attached' legado
          pending: stats.pending || 0,
          approved: stats.approved || 0,
          needsAdjustment: stats.needsAdjustment || 0,
          criticalPoints: stats.criticalPoints || 0,
        },
        authorizedClients: campaign.authorizedClients,
        sentForApprovalAt: campaign.sentForApprovalAt,
        approvedAt: campaign.approvedAt,
        approvalLink: ['sent_for_approval', 'in_review', 'needs_changes', 'approved'].includes(campaign.status) && campaign.approvalHash ? 
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
        status: 'needs_changes' // Só pode reenviar se estiver com status 'needs_changes'
      },
      include: [{
          model: CreativeLine,
          as: 'creativeLines',
          attributes: ['id'],
          required: false,
          include: {
            model: Piece,
            as: 'pieces',
            attributes: ['id', 'status'],
            required: false
          }
      }]
    });

    if (!campaign) {
      return res.status(404).json({ 
        error: 'Campanha não encontrada ou não está em status de "Precisa Ajustes"' 
      });
    }

    const pieceIds = (campaign.creativeLines || []).reduce((acc, line) => {
        return acc.concat((line.pieces || []).map(p => p.id));
    }, []);

    if (pieceIds.length === 0) {
        await campaign.update({
            status: 'sent_for_approval',
            sentForApprovalAt: new Date()
        });
         return res.json({
            success: true,
            message: 'Campanha (sem peças) reenviada para aprovação',
            approvalLink: `${process.env.FRONTEND_URL}/client/approval/${campaign.approvalHash}`
        });
    }

    // Resetar peças que precisavam de ajuste para 'pending'
    const [updateCount] = await Piece.update(
      { 
        status: 'pending',
        comment: null,
        reviewedAt: null,
        reviewedBy: null
      },
      { 
        where: { 
          id: { [Op.in]: pieceIds }, 
          status: { [Op.in]: ['needs_adjustment', 'critical_points'] }
        } 
      }
    );
    
    console.log(`[Resend] Campanha ${campaignId}: ${updateCount} peças resetadas para 'pending'.`);

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