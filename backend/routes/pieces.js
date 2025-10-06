// Em: backend/routes/pieces.js (VERSÃO FINAL CORRIGIDA E COM PROXY)

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Piece, CreativeLine, Campaign } = require('../models');
const { ensureAuth } = require('../auth');
const fetch = require('node-fetch'); // Necessário para buscar do Drive

// ROTA PARA DELETAR MÚLTIPLAS PEÇAS
router.delete('/', ensureAuth, async (req, res, next) => {
  try {
    const { pieceIds } = req.body;
    if (!Array.isArray(pieceIds) || pieceIds.length === 0) {
      return res.status(400).json({ error: 'Nenhum ID de peça foi fornecido.' });
    }

    const piecesToDelete = await Piece.findAll({
      where: { id: { [Op.in]: pieceIds } },
      include: {
        model: CreativeLine,
        as: 'creativeLine',
        attributes: ['id'],
        include: { model: Campaign, as: 'campaign', attributes: ['createdBy'] },
      }
    });

    if (piecesToDelete.length === 0) {
      return res.status(404).json({ error: 'Nenhuma das peças foi encontrada.' });
    }

    const isOwner = piecesToDelete.every(p => p.creativeLine?.campaign?.createdBy === req.user.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Acesso negado para apagar uma ou mais peças.' });
    }

    const deletedCount = await Piece.destroy({ where: { id: { [Op.in]: pieceIds } } });
    res.status(200).json({ message: `${deletedCount} peças foram apagadas com sucesso.` });
  } catch (error) {
    next(error);
  }
});

// NOVA ROTA DE PROXY PARA IMAGENS DO GOOGLE DRIVE
router.get('/drive/:pieceId', ensureAuth, async (req, res, next) => {
  try {
    const { pieceId } = req.params;
    const userAccessToken = req.session?.accessToken;

    if (!userAccessToken) {
      return res.status(403).json({ error: 'Token de acesso ao Google Drive não encontrado.' });
    }

    const piece = await Piece.findByPk(pieceId, {
      include: {
        model: CreativeLine, as: 'creativeLine',
        include: { model: Campaign, as: 'campaign' }
      }
    });

    // Validações de segurança
    if (!piece || !piece.driveId) {
      return res.status(404).json({ error: 'Peça não encontrada ou não é um arquivo do Drive.' });
    }
    if (piece.creativeLine?.campaign?.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado a esta peça.' });
    }

    // Faz a requisição autenticada para a API do Google Drive
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${piece.driveId}?alt=media`;
    const driveResponse = await fetch(driveUrl, {
      headers: { 'Authorization': `Bearer ${userAccessToken}` }
    });

    if (!driveResponse.ok) {
      return res.status(driveResponse.status).json({ error: `Erro ao buscar arquivo do Google Drive: ${driveResponse.statusText}` });
    }
    
    // Define o tipo de conteúdo e envia a imagem para o frontend
    res.setHeader('Content-Type', piece.mimetype);
    driveResponse.body.pipe(res);

  } catch (error) {
    next(error);
  }
});

module.exports = router;