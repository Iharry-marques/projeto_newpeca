// Em: backend/routes/creativeLines.js (NOVO ARQUIVO)

const express = require('express');
const router = express.Router();
const { CreativeLine, Campaign } = require('../models');
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

module.exports = router;
