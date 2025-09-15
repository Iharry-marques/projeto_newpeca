// backend/routes/clientAuth.js

const express = require('express');
const jwt = require('jsonwebtoken');
const { Client } = require('../models');
const router = express.Router();

// Middleware para verificar token de cliente
const authenticateClient = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const client = await Client.findByPk(decoded.clientId);
    
    if (!client || !client.isActive) {
      return res.status(401).json({ error: 'Cliente não encontrado ou inativo' });
    }

    req.client = client;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Login de cliente
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const client = await Client.findOne({ where: { email, isActive: true } });
    if (!client) {
      return res.status(401).json({ error: 'Cliente não encontrado' });
    }

    const isValidPassword = await client.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign(
      { clientId: client.id, email: client.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
      },
    });
  } catch (error) {
    console.error('Erro no login do cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar status de autenticação do cliente
router.get('/status', authenticateClient, (req, res) => {
  res.json({
    isAuthenticated: true,
    client: {
      id: req.client.id,
      name: req.client.name,
      email: req.client.email,
      company: req.client.company,
    },
  });
});

// Logout (invalidar token no frontend)
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});

// BUSCAR CAMPANHAS ATRIBUÍDAS AO CLIENTE
router.get('/campaigns', authenticateClient, async (req, res) => {
  try {
    const clientId = req.client.id;
    const { Campaign, Piece } = require('../models');

    const client = await Client.findByPk(clientId, {
      include: [{
        model: Campaign,
        as: 'assignedCampaigns',
        through: { 
          attributes: ['assignedAt', 'clientStatus', 'canApprove', 'canComment'],
          where: { clientId: clientId }
        },
        include: [{
          model: Piece,
          attributes: ['id', 'status', 'reviewedAt'],
          required: false
        }],
        attributes: ['id', 'name', 'client', 'creativeLine', 'status', 'approvalHash', 'createdAt', 'sentForApprovalAt']
      }]
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Adicionar estatísticas das peças para cada campanha
    const campaignsWithStats = client.assignedCampaigns.map(campaign => {
      const pieces = campaign.Pieces || [];
      const pieceStats = pieces.reduce((acc, piece) => {
        acc[piece.status] = (acc[piece.status] || 0) + 1;
        return acc;
      }, {});

      return {
        ...campaign.toJSON(),
        pieceStats: {
          pending: pieceStats.pending || 0,
          approved: pieceStats.approved || 0,
          needsAdjustment: pieceStats.needs_adjustment || 0,
          criticalPoints: pieceStats.critical_points || 0,
        }
      };
    });

    res.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company
      },
      campaigns: campaignsWithStats
    });
    
  } catch (error) {
    console.error('Erro ao buscar campanhas do cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = { router, authenticateClient };