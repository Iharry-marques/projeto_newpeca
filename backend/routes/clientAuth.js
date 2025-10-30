// backend/routes/clientAuth.js
// *** VERSÃO CORRIGIDA PARA ERRO 500 ***

const express = require('express');
const jwt = require('jsonwebtoken');
// Adicione Op, CreativeLine, MasterClient
const { Op } = require('sequelize');
const { Client, Campaign, Piece, CampaignClient, CreativeLine, MasterClient } = require('../models');
const router = express.Router();

// Middleware para verificar token de cliente
const authenticateClient = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    // console.log('[DEBUG] authenticateClient - Token recebido:', token ? `...${token.slice(-6)}` : 'Nenhum');

    if (!token) {
      // console.log('[DEBUG] authenticateClient - Falha: Token não fornecido.');
      return res.status(401).json({ error: 'Token de acesso não fornecido' });
    }
    
    // console.log('[DEBUG] authenticateClient - Verificando token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    // console.log('[DEBUG] authenticateClient - Token decodificado:', decoded);

    const client = await Client.findByPk(decoded.clientId);
    // console.log('[DEBUG] authenticateClient - Cliente encontrado no DB:', client ? client.id : 'Não encontrado');

    if (!client || !client.isActive) {
      // console.log('[DEBUG] authenticateClient - Falha: Cliente não encontrado ou inativo.');
      return res.status(401).json({ error: 'Cliente não encontrado ou inativo' });
    }

    req.client = client;
    // console.log('[DEBUG] authenticateClient - Autenticação OK.');
    next();
  } catch (error) {
    // console.error('[DEBUG] authenticateClient - Erro na verificação do token:', error.name, error.message);
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Login de cliente (sem alteração)
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

// Verificar status de autenticação do cliente (sem alteração)
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

// Logout (sem alteração)
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout realizado com sucesso' });
});

// BUSCAR CAMPANHAS ATRIBUÍDAS AO CLIENTE (Query corrigida)
router.get('/campaigns', authenticateClient, async (req, res) => {
  try {
    const clientId = req.client.id;
    console.log(`[DEBUG] /client-auth/campaigns - Buscando campanhas para clientId: ${clientId}`);

    console.log('[DEBUG] /client-auth/campaigns - Iniciando consulta Client.findByPk...');
    const client = await Client.findByPk(clientId, {
      include: [{
        model: Campaign,
        as: 'assignedCampaigns',
        // Filtra campanhas que estão prontas para o cliente ver
        where: {
          status: { [Op.in]: ['sent_for_approval', 'in_review', 'needs_changes', 'approved'] }
        },
        through: { 
          attributes: ['assignedAt', 'clientStatus']
        },
        include: [
          {
            model: MasterClient, // Inclui a empresa mestre
            as: 'masterClient',
            attributes: ['id', 'name']
          },
          {
            model: CreativeLine, // *** ESTA É A CORREÇÃO ***
            as: 'creativeLines',
            attributes: ['id'], 
            required: false,
            include: [{
              model: Piece, // Inclui as Peças dentro das Linhas Criativas
              as: 'pieces',
              attributes: ['id', 'status', 'reviewedAt'],
              required: false
            }]
          }
        ],
        // 'client' (string) não existe mais no modelo Campaign, usamos MasterClientId
        attributes: ['id', 'name', 'MasterClientId', 'creativeLine', 'status', 'approvalHash', 'createdAt', 'sentForApprovalAt']
      }]
    });
    console.log(`[DEBUG] /client-auth/campaigns - Consulta finalizada. Cliente encontrado: ${!!client}`);

    if (!client || !client.assignedCampaigns || client.assignedCampaigns.length === 0) {
      console.warn(`[DEBUG] /client-auth/campaigns - Cliente ID ${clientId} não tem campanhas ativas.`);
      // Retorna sucesso com lista vazia
      return res.json({
        client: {
          id: req.client.id,
          name: req.client.name,
          email: req.client.email,
          company: req.client.company
        },
        campaigns: []
      });
    }

    console.log(`[DEBUG] /client-auth/campaigns - Processando ${client.assignedCampaigns.length} campanhas.`);
    
    const campaignsWithStats = client.assignedCampaigns.map(campaign => {
      const campaignJson = campaign.toJSON();
      
      // 1. Agrega peças de *todas* as linhas criativas
      const allPieces = (campaignJson.creativeLines || []).reduce((acc, line) => {
        return acc.concat(line.pieces || []);
      }, []);

      // 2. Calcula estatísticas com base nas peças agregadas
      const pieceStats = allPieces.reduce((acc, piece) => {
        // Mapeia status do DB para chaves do frontend
        let key = piece.status;
        if (key === 'needs_adjustment') key = 'needsAdjustment';
        if (key === 'critical_points') key = 'criticalPoints';
        
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      return {
        ...campaignJson,
        // 3. Usa o nome do MasterClient que incluímos
        client: campaignJson.masterClient?.name || 'Empresa não informada',
        pieceStats: {
          pending: pieceStats.pending || 0,
          approved: pieceStats.approved || 0,
          needsAdjustment: pieceStats.needsAdjustment || 0,
          criticalPoints: pieceStats.criticalPoints || 0,
        },
        creativeLines: undefined, // Limpa dados aninhados desnecessários
        masterClient: undefined, // Limpa dados aninhados desnecessários
      };
    });
    
    console.log('[DEBUG] /client-auth/campaigns - Processamento concluído. Enviando resposta.');

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
    console.error('[ERRO] em GET /client-auth/campaigns:', error); // Log completo do erro
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = { router, authenticateClient };