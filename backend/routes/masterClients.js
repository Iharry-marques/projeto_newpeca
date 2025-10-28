// backend/routes/masterClients.js
const express = require("express");

const router = express.Router();
const { MasterClient } = require("../models");
const { ensureAuth } = require("../auth"); // Apenas usuários logados podem ver a lista

// GET /master-clients - Lista todos os clientes mestre (empresas)
router.get("/", ensureAuth, async (req, res, next) => {
  try {
    const masterClients = await MasterClient.findAll({
      order: [["name", "ASC"]], // Ordena por nome
      attributes: ["id", "name"], // Retorna apenas ID e Nome
    });
    res.status(200).json(masterClients);
  } catch (error) {
    next(error); // Passa o erro para o errorHandler
  }
});

// POST /master-clients - Cria um novo cliente mestre (APENAS ADMIN)
// (Adicionaremos ensureAdmin mais tarde se necessário, por enquanto protegido por ensureAuth)
// router.post("/", ensureAuth, ensureAdmin, async (req, res, next) => { ... });
// TODO: Adicionar rotas PUT e DELETE se precisar gerenciar MasterClients via API

module.exports = router;
