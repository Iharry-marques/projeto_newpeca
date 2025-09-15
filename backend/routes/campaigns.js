// backend/routes/campaigns.js - Atualizado com novo fluxo

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Campaign, Piece, Client, CampaignClient, User } = require('../models');

// Middleware de verificação de autenticação
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Usuário não autenticado.' });
}

const upload = multer({ dest: path.join(__dirname, '../uploads') });

/* ========== CAMPANHAS ========== */

// CRIAR NOVA CAMPANHA
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { name, client, creativeLine, startDate, endDate, notes } = req.body;
    
    if (!name || !client) {
      return res.status(400).json({ 
        error: 'Nome e cliente da campanha são obrigatórios.' 
      });
    }

    const campaign = await Campaign.create({ 
      name, 
      client, 
      creativeLine,
      startDate: startDate || null,
      endDate: endDate || null,
      notes: notes || null,
      createdBy: req.user.id,
      status: 'draft'
    });

    res.status(201).json(campaign);
  } catch (err) {
    console.error('Erro ao criar campanha:', err);
    res.status(400).json({ error: err.message });
  }
});

// BUSCAR TODAS AS CAMPANHAS (do usuário logado)
router.get('/', ensureAuthenticated, async (req, res) => {
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
          through: { attributes: ['assignedAt'] },
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(campaigns);
  } catch (err) {
    console.error('Erro ao buscar campanhas:', err);
    res.status(500).json({ error: 'Erro interno ao buscar campanhas.' });
  }
});

// BUSCAR CAMPANHA ESPECÍFICA
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [
        {
          model: Piece,
          order: [['order', 'ASC'], ['createdAt', 'ASC']]
        },
        {
          model: Client,
          as: 'authorizedClients',
          through: { attributes: ['assignedAt', 'canApprove', 'canComment', 'clientStatus'] },
          attributes: ['id', 'name', 'email', 'company']
        }
      ]
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    res.json(campaign);
  } catch (err) {
    console.error('Erro ao buscar campanha:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ========== UPLOAD DE PEÇAS ========== */

// UPLOAD DE PEÇAS (estado inicial: 'uploaded')
router.post('/:id/upload', ensureAuthenticated, upload.array('files'), async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    // Verificar se campanha existe e pertence ao usuário
    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id }
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const pieces = await Promise.all(
      req.files.map(async (file) => {
        return await Piece.create({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          status: 'uploaded', // Estado inicial
          CampaignId: campaignId,
        });
      })
    );

    res.json({
      success: true,
      message: `${pieces.length} arquivo(s) enviado(s) com sucesso`,
      pieces: pieces.map(piece => ({
        id: piece.id,
        filename: piece.filename,
        originalName: piece.originalName,
        mimetype: piece.mimetype,
        size: piece.size,
        status: piece.status,
        createdAt: piece.createdAt
      }))
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ANEXAR PEÇAS À CAMPANHA (uploaded → attached)
router.post('/:id/attach-pieces', ensureAuthenticated, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { pieceIds } = req.body; // Array de IDs das peças

    if (!pieceIds || !Array.isArray(pieceIds) || pieceIds.length === 0) {
      return res.status(400).json({ error: 'IDs das peças são obrigatórios' });
    }

    // Verificar campanha
    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id }
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    // Atualizar peças para 'attached'
    const [updatedCount] = await Piece.update(
      { 
        status: 'attached',
        attachedAt: new Date()
      },
      { 
        where: { 
          id: pieceIds,
          CampaignId: campaignId,
          status: 'uploaded' // Só pode anexar peças uploadadas
        } 
      }
    );

    if (updatedCount === 0) {
      return res.status(400).json({ 
        error: 'Nenhuma peça foi anexada. Verifique se as peças existem e estão no estado correto.' 
      });
    }

    res.json({
      success: true,
      message: `${updatedCount} peça(s) anexada(s) à campanha`,
      attachedCount: updatedCount
    });
  } catch (error) {
    console.error('Erro ao anexar peças:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DESANEXAR PEÇAS (attached → uploaded)
router.post('/:id/detach-pieces', ensureAuthenticated, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { pieceIds } = req.body;

    const [updatedCount] = await Piece.update(
      { 
        status: 'uploaded',
        attachedAt: null
      },
      { 
        where: { 
          id: pieceIds,
          CampaignId: campaignId,
          status: 'attached'
        } 
      }
    );

    res.json({
      success: true,
      message: `${updatedCount} peça(s) desanexada(s)`,
      detachedCount: updatedCount
    });
  } catch (error) {
    console.error('Erro ao desanexar peças:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ========== ENVIO PARA CLIENTE ========== */

// ENVIAR CAMPANHA PARA APROVAÇÃO
router.post('/:id/send-for-approval', ensureAuthenticated, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { clientIds } = req.body; // Array opcional de IDs de clientes

    // Buscar campanha com peças anexadas
    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id },
      include: [
        {
          model: Piece,
          where: { status: 'attached' },
          required: false
        }
      ]
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    if (!campaign.Pieces || campaign.Pieces.length === 0) {
      return res.status(400).json({ 
        error: 'Não é possível enviar uma campanha sem peças anexadas' 
      });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Apenas campanhas em rascunho podem ser enviadas' 
      });
    }

    // Atualizar status das peças anexadas para 'pending'
    await Piece.update(
      { status: 'pending' },
      { 
        where: { 
          CampaignId: campaignId,
          status: 'attached'
        } 
      }
    );

    // Atualizar campanha
    await campaign.update({
      status: 'sent_for_approval',
      sentForApprovalAt: new Date()
    });

    // Se clientIds foram especificados, criar ACL
    if (clientIds && clientIds.length > 0) {
      const assignmentPromises = clientIds.map(clientId => 
        CampaignClient.upsert({
          campaignId: campaignId,
          clientId: clientId,
          assignedAt: new Date()
        })
      );
      await Promise.all(assignmentPromises);
    }

    res.json({
      success: true,
      message: 'Campanha enviada para aprovação com sucesso',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: 'sent_for_approval',
        approvalLink: `${process.env.FRONTEND_URL}/client/approval/${campaign.approvalHash}`,
        pieceCount: campaign.Pieces.length,
        sentForApprovalAt: campaign.sentForApprovalAt
      }
    });
  } catch (error) {
    console.error('Erro ao enviar campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ========== ARQUIVOS ESTÁTICOS ========== */

// Servir arquivos
router.get('/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  res.sendFile(filePath);
});

module.exports = router;