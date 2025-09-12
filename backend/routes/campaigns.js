const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Campaign, Piece } = require('../models');

// Middleware de verificação de autenticação para rotas protegidas
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Usuário não autenticado.' });
}

const upload = multer({ dest: path.join(__dirname, '../uploads') });

/* ========== Rotas de Campanhas (Campaigns) ========== */

// ROTA PARA CRIAR UMA NOVA CAMPANHA
router.post('/', ensureAuthenticated, async (req, res) => {
  console.log('Corpo da requisição para criar campanha:', req.body);
  const { name, client, creativeLine } = req.body;
  try {
    if (!name || !client) {
      return res.status(400).json({ error: 'Nome e cliente da campanha são obrigatórios.' });
    }
    const campaign = await Campaign.create({ name, client, creativeLine });
    res.status(201).json({ id: campaign.id, name, client, creativeLine });
  } catch (err) {
    console.error('Erro ao criar campanha:', err);
    res.status(400).json({ error: err.message });
  }
});

// ROTA PARA BUSCAR TODAS AS CAMPANHAS
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      order: [['createdAt', 'DESC']] // Ordena da mais nova para a mais antiga
    });
    res.json(campaigns);
  } catch(err) {
    console.error('Erro ao buscar campanhas:', err);
    res.status(500).json({ error: 'Erro interno ao buscar campanhas.'});
  }
});

/* ========== Rotas de Peças (Pieces) e Aprovação ========== */

// Rota para upload de peças (files) para uma campanha específica
router.post('/:id/upload', ensureAuthenticated, upload.array('files'), async (req, res) => {
  const campaign = await Campaign.findByPk(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const pieces = await Promise.all(req.files.map(f => Piece.create({
    filename: f.filename,
    mimetype: f.mimetype,
    CampaignId: campaign.id,
  })));
  res.json(pieces);
});

// Rota pública para visualização e aprovação
router.get('/approval/:hash', async (req, res) => {
  const campaign = await Campaign.findOne({
    where: { approvalHash: req.params.hash },
    include: Piece
  });
  if (!campaign) return res.status(404).json({ error: 'Invalid link' });
  res.json({ campaign });
});

// Rota para salvar o feedback de aprovação
router.post('/approval/:hash', async (req, res) => {
  const { pieces } = req.body;
  const campaign = await Campaign.findOne({
    where: { approvalHash: req.params.hash },
    include: Piece
  });
  if (!campaign) return res.status(404).json({ error: 'Invalid link' });

  for (const p of pieces) {
    const piece = await Piece.findOne({ where: { id: p.id, CampaignId: campaign.id } });
    if (piece) {
      piece.status = p.status;
      piece.comment = p.comment;
      await piece.save();
    }
  }
  res.json({ message: 'Feedback recorded' });
});

// Rota para servir os arquivos estáticos (peças)
router.get('/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  res.sendFile(filePath);
});

module.exports = router;
