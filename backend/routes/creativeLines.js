// Em: backend/routes/creativeLines.js (NOVO ARQUIVO)

const express = require('express');
const router = express.Router();
const { CreativeLine, Campaign, Piece, sequelize } = require('../models');
const { ensureAuth } = require('../auth');

// Middleware para verificar se a linha criativa pertence ao usuário
const checkOwnership = async (req, res, next) => {
  try {
    const line = await CreativeLine.findByPk(req.params.id, {
      include: { model: Campaign, as: 'campaign' },
    });

    if (!line) {
      return res.status(404).json({ error: 'Linha Criativa não encontrada.' });
    }
    if (!line.campaign || line.campaign.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    req.creativeLine = line; // Passa a linha para a próxima função
    next();
  } catch (error) {
    next(error);
  }
};

// ROTA PARA ATUALIZAR (EDITAR) NOME
router.put('/:id', ensureAuth, checkOwnership, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'O nome não pode ser vazio.' });
    }
    const updatedLine = await req.creativeLine.update({ name: name.trim() });
    res.status(200).json(updatedLine);
  } catch (error) {
    next(error);
  }
});

// ROTA PARA DELETAR
router.delete('/:id', ensureAuth, checkOwnership, async (req, res, next) => {
  try {
    await req.creativeLine.destroy();
    res.status(204).send(); // 204 No Content -> sucesso, sem corpo de resposta
  } catch (error) {
    next(error);
  }
});

// ROTA PARA REORDENAR PEÇAS
router.put('/:id/reorder', ensureAuth, checkOwnership, async (req, res, next) => {
  try {
    const { pieceOrder } = req.body;
    if (!Array.isArray(pieceOrder)) {
      return res.status(400).json({ error: 'A nova ordem das peças deve ser um array.' });
    }

    const normalizedOrder = pieceOrder
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value));
    if (normalizedOrder.length !== pieceOrder.length) {
      return res.status(400).json({ error: 'IDs de peças inválidos foram informados.' });
    }

    const existingPieces = await Piece.findAll({
      where: { CreativeLineId: req.creativeLine.id },
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });

    if (existingPieces.length !== normalizedOrder.length) {
      return res.status(400).json({ error: 'A lista de peças enviada está incompleta.' });
    }

    const existingIds = new Set(existingPieces.map((piece) => piece.id));
    const hasAllPieces = normalizedOrder.every((id) => existingIds.has(id));
    if (!hasAllPieces || new Set(normalizedOrder).size !== normalizedOrder.length) {
      return res.status(400).json({ error: 'A nova ordem contém peças desconhecidas ou duplicadas.' });
    }

    const transaction = await sequelize.transaction();
    try {
      await Promise.all(
        normalizedOrder.map((pieceId, index) =>
          Piece.update({ order: index }, { where: { id: pieceId }, transaction })
        )
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const updatedPieces = await Piece.findAll({
      where: { CreativeLineId: req.creativeLine.id },
      order: [['order', 'ASC'], ['createdAt', 'ASC']],
    });

    res.status(200).json({ pieces: updatedPieces });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
