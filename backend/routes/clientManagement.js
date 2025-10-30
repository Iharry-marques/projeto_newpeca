// backend/routes/clientManagement.js

const express = require('express');
const { Op } = require('sequelize');
const { Client, Campaign, CampaignClient, MasterClient } = require('../models');
const router = express.Router();
const { ensureAdmin } = require('../middleware/authorization');

const FRIENDLY_STATUS_MAP = {
  approved: 'Aprovada',
  sent_for_approval: 'Enviada para Aprovação',
  in_review: 'Em Revisão',
  draft: 'Rascunho',
  needs_changes: 'Precisa de Alterações'
};

// LISTAR TODOS OS CLIENTES
router.get('/', async (req, res) => {
  try {
    const whereClause = {};

    if (req.query.masterClientId) {
      const masterClientIdNum = parseInt(req.query.masterClientId, 10);
      if (Number.isNaN(masterClientIdNum)) {
        return res
          .status(400)
          .json({ error: 'MasterClientId inválido fornecido para filtro.' });
      }
      whereClause.MasterClientId = masterClientIdNum;
    }

    const clients = await Client.findAll({
      where: whereClause,
      attributes: [
        'id',
        'name',
        'email',
        'company',
        'isActive',
        'createdAt',
        'MasterClientId',
      ],
      include: [
        {
          model: MasterClient,
          as: 'masterClient',
          attributes: ['id', 'name'],
        },
      ],
      order: [['name', 'ASC']],
    });
    res.json(clients);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// CRIAR NOVO CLIENTE
router.post('/', ensureAdmin, async (req, res) => {
  try {
    const { name, email, MasterClientId, password, company } = req.body;
    const masterClientIdNum = parseInt(MasterClientId, 10);

    if (!name || !email || !password || Number.isNaN(masterClientIdNum)) {
      return res.status(400).json({
        error: 'Nome, email, senha e ID da empresa cliente são obrigatórios',
      });
    }

    const masterClientExists = await MasterClient.findByPk(masterClientIdNum);
    if (!masterClientExists) {
      return res
        .status(400)
        .json({ error: 'Empresa cliente selecionada inválida.' });
    }

    // Verificar se já existe
    const existingClient = await Client.findOne({ where: { email } });
    if (existingClient) {
      return res.status(400).json({
        error: 'Já existe um cliente com este email',
      });
    }

    const client = await Client.create({
      name,
      email,
      password,
      MasterClientId: masterClientIdNum,
      company: company || null,
      isActive: true,
    });

    const clientWithDetails = await Client.findByPk(client.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: MasterClient, as: 'masterClient', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json(clientWithDetails);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      return res
        .status(400)
        .json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ATUALIZAR CLIENTE
router.put('/:id', ensureAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;
    const { name, email, MasterClientId, isActive, password, company } = req.body;

    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verificar email duplicado (se mudou)
    if (email && email !== client.email) {
      const existingClient = await Client.findOne({
        where: { email, id: { [Op.ne]: clientId } },
      });
      if (existingClient) {
        return res.status(400).json({
          error: 'Já existe um cliente com este email',
        });
      }
    }

    let masterClientIdNum;
    if (MasterClientId !== undefined) {
      masterClientIdNum = parseInt(MasterClientId, 10);
      if (Number.isNaN(masterClientIdNum)) {
        return res
          .status(400)
          .json({ error: 'ID da empresa cliente inválido.' });
      }
      if (masterClientIdNum !== client.MasterClientId) {
        const masterClientExists = await MasterClient.findByPk(
          masterClientIdNum
        );
        if (!masterClientExists) {
          return res
            .status(400)
            .json({ error: 'Empresa cliente selecionada inválida.' });
        }
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (masterClientIdNum !== undefined) {
      updateData.MasterClientId = masterClientIdNum;
    }
    if (company !== undefined) updateData.company = company;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) updateData.password = password; // Hook criptografará

    await client.update(updateData);

    const updatedClientWithDetails = await Client.findByPk(client.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: MasterClient, as: 'masterClient', attributes: ['id', 'name'] },
      ],
    });

    res.json(updatedClientWithDetails);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    if (
      error.name === 'SequelizeValidationError' ||
      error.name === 'SequelizeUniqueConstraintError'
    ) {
      return res
        .status(400)
        .json({ error: error.errors.map((e) => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DESATIVAR/REATIVAR CLIENTE
router.patch('/:id/toggle-status', ensureAdmin, async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await Client.findByPk(clientId);
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    await client.update({ isActive: !client.isActive });
    
    const updatedClientWithDetails = await Client.findByPk(client.id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: MasterClient, as: 'masterClient', attributes: ['id', 'name'] },
      ],
    });

    res.json(updatedClientWithDetails);
  } catch (error) {
    console.error('Erro ao alterar status do cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// LISTAR CAMPANHAS DE UM CLIENTE
router.get('/:id/campaigns', async (req, res) => {
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
router.post('/assign-campaign', async (req, res) => {
  try {
    const { campaignId, clientId, canApprove = true, canComment = true } = req.body;

    if (!campaignId || !clientId) {
      return res.status(400).json({ 
        error: 'campaignId e clientId são obrigatórios' 
      });
    }

    // Verificar se campanha existe e pertence ao usuário logado
    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id }
    });
    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada ou você não tem permissão.' });
    }

    if (['approved', 'sent_for_approval', 'in_review'].includes(campaign.status)) {
      const friendlyStatus = FRIENDLY_STATUS_MAP[campaign.status] || campaign.status;
      return res.status(400).json({ error: `Esta campanha já está "${friendlyStatus}" e não pode ser enviada novamente.` });
    }

    // Verificar se cliente existe, está ativo e pertence ao MasterClient da campanha
    const client = await Client.findOne({
      where: {
        id: clientId,
        isActive: true,
        MasterClientId: campaign.MasterClientId
      }
    });
    if (!client) {
      return res.status(404).json({ error: 'Cliente selecionado não encontrado, inativo ou não pertence à empresa desta campanha.' });
    }

    // Criar/atualizar associação
    const [campaignClient, created] = await CampaignClient.upsert({
      campaignId,
      clientId,
      canApprove,
      canComment,
      assignedAt: new Date(),
      clientStatus: 'pending'
    });

    if (campaign.status === 'draft' || campaign.status === 'needs_changes') {
      await campaign.update({
        status: 'sent_for_approval',
        sentForApprovalAt: new Date()
      });
      console.log(`[Assign Campaign] Status da campanha ${campaignId} atualizado para sent_for_approval.`);
    } else {
      console.log(`[Assign Campaign] Status da campanha ${campaignId} (${campaign.status}) não modificado.`);
    }

    res.json({
      success: true,
      message: created
        ? 'Cliente atribuído à campanha e campanha enviada para aprovação.'
        : 'Atribuição atualizada.',
      campaignStatus: campaign.status,
      sentForApprovalAt: campaign.sentForApprovalAt,
      assignment: campaignClient
    });
  } catch (error) {
    console.error('Erro ao atribuir cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao atribuir cliente.' });
  }
});

// REMOVER CLIENTE DE CAMPANHA
router.delete('/unassign-campaign', async (req, res) => {
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
