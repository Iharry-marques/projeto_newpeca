// Em: backend/routes/pieces.js (VERSÃO FINAL CORRIGIDA)

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Piece, CreativeLine, Campaign } = require('../models');
const { ensureAuth } = require('../auth');

// ROTA PARA DELETAR MÚLTIPLAS PEÇAS
router.delete('/', ensureAuth, async (req, res, next) => {
  try {
    const { pieceIds } = req.body;

    if (!Array.isArray(pieceIds) || pieceIds.length === 0) {
      return res.status(400).json({ error: 'Nenhum ID de peça foi fornecido.' });
    }

    // --- Verificação de Segurança (CORRIGIDA) ---
    const piecesToDelete = await Piece.findAll({
      where: { id: { [Op.in]: pieceIds } },
      include: {
        model: CreativeLine,
        as: 'creativeLine', // <-- CORREÇÃO APLICADA AQUI
        attributes: ['id'],
        include: {
          model: Campaign,
          as: 'campaign', // Usa o alias definido na associação
          attributes: ['createdBy'],
        },
      }
    });

    if (piecesToDelete.length === 0) {
        return res.status(404).json({ error: 'Nenhuma das peças foi encontrada.' });
    }

    const isOwner = piecesToDelete.every(p => p.creativeLine?.campaign?.createdBy === req.user.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Acesso negado para apagar uma ou mais peças.' });
    }
    // --- Fim da Verificação ---

    const deletedCount = await Piece.destroy({ where: { id: { [Op.in]: pieceIds } } });

    res.status(200).json({ message: `${deletedCount} peças foram apagadas com sucesso.` });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
