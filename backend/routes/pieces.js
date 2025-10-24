// Em: backend/routes/pieces.js (VERSÃO FINAL CORRIGIDA E COM PROXY)

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Piece, CreativeLine, Campaign } = require('../models');
const { ensureAuth } = require('../auth');
const fetch = require('node-fetch'); // Necessário para buscar do Drive
const { convertRawImageIfNeeded, isRawImage } = require('../utils/media');

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

// ROTA PARA ATUALIZAR CAMPOS DA PEÇA (nome, comentário, etc.)
router.put('/:id', ensureAuth, async (req, res, next) => {
  try {
    const { originalName, comment } = req.body;

    const isUpdatingName = originalName !== undefined;
    const isUpdatingComment = comment !== undefined;

    if (!isUpdatingName && !isUpdatingComment) {
      return res.status(400).json({ error: 'Nenhum campo válido foi enviado para atualização.' });
    }

    let trimmedName;
    if (isUpdatingName) {
      trimmedName = String(originalName ?? '').trim();
      if (!trimmedName) {
        return res.status(400).json({ error: 'O nome da peça não pode ser vazio.' });
      }
    }

    const piece = await Piece.findByPk(req.params.id, {
      include: {
        model: CreativeLine,
        as: 'creativeLine',
        include: {
          model: Campaign,
          as: 'campaign',
          attributes: ['createdBy'],
        },
      },
    });

    if (!piece) {
      return res.status(404).json({ error: 'Peça não encontrada.' });
    }

    if (piece.creativeLine?.campaign?.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado para editar esta peça.' });
    }

    if (isUpdatingName) {
      piece.originalName = trimmedName;
    }

    if (isUpdatingComment) {
      piece.comment = comment;
    }

    await piece.save();

    res.status(200).json(piece);
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

    const contentType = driveResponse.headers.get('content-type') || piece.mimetype || 'application/octet-stream';

    if (isRawImage(piece.mimetype, piece.originalName)) {
      const driveBuffer = await driveResponse.buffer();
      const { buffer: convertedBuffer, mimetype } = await convertRawImageIfNeeded(driveBuffer, {
        mimetype: piece.mimetype,
        originalName: piece.originalName,
        filename: piece.filename,
      });
      res.setHeader('Content-Type', mimetype || contentType);
      res.send(convertedBuffer);
    } else {
      res.setHeader('Content-Type', contentType);
      driveResponse.body.pipe(res);
    }

  } catch (error) {
    next(error);
  }
});

module.exports = router;
