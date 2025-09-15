// backend/routes/clientManagement.js

const express = require('express');
const { Client, Campaign, CampaignClient } = require('../models');
const router = express.Router();

// Middleware para verificar se é usuário Suno
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Usuário não autenticado.' });
}

// LISTAR TODOS OS CLIENTES
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const clients = await Client.findAll({
      attributes: ['id', 'name', 'email', 'company', 'isActive', 'createdAt'],
      order: [['name', 'ASC']]
    });
    res.json(clients);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CRIAR NOVO CLIENTE
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { name, email, company, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Nome, email e senha são obrigatórios' 
      });
    }

    // Verificar se já existe
    const existingClient = await Client.findOne({ where: { email } });
    if (existingClient) {
      return res.status(400).json({ 
        error: 'Já existe um cliente com este email' 
      });
    }

    const client = await Client.create({
      name,
      email,
      company,
      password, // Será criptografada automaticamente pelo hook
      isActive: true
    });

    // Retornar sem a senha
    const { password: _, ...clientData } = client.toJSON();
    res.status(201).json(clientData);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ATUALIZAR CLIENTE
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const clientId = req.params.id;
    const { name, email, company, isActive, password } = req.body;

    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar email duplicado (se mudou)
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({ 
        where: { email, id: { [require('sequelize').Op.ne]: clientId } }
      });
      if (existingClient) {
        return res.status(400).json({ 
          error: 'Já existe um cliente com este email' 
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) updateData.password = password; // Hook criptografará

    await client.update(updateData);

    // Retornar sem a senha
    const { password: _, ...clientData } = client.toJSON();
    res.json(clientData);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DESATIVAR/REATIVAR CLIENTE
router.patch('/:id/toggle-status', ensureAuthenticated, async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await Client.findByPk(clientId);
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    await client.update({ isActive: !client.isActive });
    
    const { password: _, ...clientData } = client.toJSON();
    res.json(clientData);
  } catch (error) {
    console.error('Erro ao alterar status do cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// LISTAR CAMPANHAS DE UM CLIENTE
router.get('/:id/campaigns', ensureAuthenticated, async (req, res) => {
  try {
    const clientId = req.params.id;
    
    const client = await Client.findByPk(clientId, {
      include: [{
        model: Campaign,
        as: 'assignedCampaigns',
        through: { attributes: ['assignedAt', 'clientStatus'] },
        attributes: ['id', 'name', 'client', 'status', 'createdAt']
      }]
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email
      },
      campaigns: client.assignedCampaigns
    });
  } catch (error) {
    console.error('Erro ao listar campanhas do cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ATRIBUIR CLIENTE A CAMPANHA
router.post('/assign-campaign', ensureAuthenticated, async (req, res) => {
  try {
    const { campaignId, clientId, canApprove = true, canComment = true } = req.body;

    if (!campaignId || !clientId) {
      return res.status(400).json({ 
        error: 'campaignId e clientId são obrigatórios' 
      });
    }

    // Verificar se campanha existe
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    // Verificar se cliente existe e está ativo
    const client = await Client.findByPk(clientId);
    if (!client || !client.isActive) {
      return res.status(404).json({ error: 'Cliente não encontrado ou inativo' });
    }

    // Criar/atualizar associação
    const [campaignClient, created] = await CampaignClient.upsert({
      campaignId,
      clientId,
      canApprove,
      canComment,
      assignedAt: new Date()
    });

    res.json({
      success: true,
      message: created ? 'Cliente atribuído à campanha' : 'Atribuição atualizada',
      assignment: campaignClient
    });
  } catch (error) {
    console.error('Erro ao atribuir cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// REMOVER CLIENTE DE CAMPANHA
router.delete('/unassign-campaign', ensureAuthenticated, async (req, res) => {
  try {
    const { campaignId, clientId } = req.body;

    const deleted = await CampaignClient.destroy({
      where: { campaignId, clientId }
    });

    if (deleted) {
      res.json({ success: true, message: 'Cliente removido da campanha' });
    } else {
      res.status(404).json({ error: 'Atribuição não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao remover cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;