// Em: backend/routes/pieces.js (ARQUIVO NOVO E COMPLETO)

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

    // --- Verificação de Segurança ---
    // Garante que o usuário só possa apagar peças de campanhas que ele criou.
    const piecesToDelete = await Piece.findAll({
      where: {
        id: { [Op.in]: pieceIds }
      },
      include: {
        model: CreativeLine,
        attributes: ['id'],
        include: {
          model: Campaign,
          attributes: ['createdBy']
        }
      }
    });

    if (piecesToDelete.length === 0) {
        return res.status(404).json({ error: 'Nenhuma das peças foi encontrada.' });
    }

    const isOwner = piecesToDelete.every(p => p.CreativeLine?.Campaign?.createdBy === req.user.id);
    if (!isOwner) {
      return res.status(403).json({ error: 'Acesso negado para apagar uma ou mais peças.' });
    }
    // --- Fim da Verificação de Segurança ---

    const deletedCount = await Piece.destroy({
      where: {
        id: { [Op.in]: pieceIds }
      }
    });

    res.status(200).json({ message: `${deletedCount} peças foram apagadas com sucesso.` });

  } catch (error) {
    next(error);
  }
});

module.exports = router;