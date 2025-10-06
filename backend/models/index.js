// Em: backend/models/index.js (Código completo atualizado)

const { Sequelize } = require('sequelize');
const config = require('../config').db;

const sequelize = new Sequelize({
  dialect: config.dialect,
  storage: config.storage,
  logging: console.log,
});

const modelDefiners = [
  require('./User'),
  require('./Client'),
  require('./Campaign'),
  require('./Piece'),
  require('./CampaignClient'),
  require('./CreativeLine'),
];

// Inicializa os models
for (const def of modelDefiners) {
  def(sequelize);
}

// Desestrutura para facilitar
const { User, Client, Campaign, Piece, CampaignClient, CreativeLine } = sequelize.models;

/* =========================== ASSOCIAÇÕES =========================== */

// User ⇄ Campaign (criador)
User.hasMany(Campaign, { foreignKey: 'createdBy', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Campaign ⇄ CreativeLine
Campaign.hasMany(CreativeLine, {
  as: 'creativeLines',
  foreignKey: 'CampaignId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
CreativeLine.belongsTo(Campaign, {
  as: 'campaign',
  foreignKey: 'CampaignId',
});

// CreativeLine ⇄ Piece
CreativeLine.hasMany(Piece, {
  as: 'pieces',
  foreignKey: 'CreativeLineId',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Piece.belongsTo(CreativeLine, {
  as: 'creativeLine',
  foreignKey: 'CreativeLineId',
});

// (Recomendado) Campaign ⇄ Piece (para includes diretos a partir de Campanha)
Campaign.hasMany(Piece, { foreignKey: 'CampaignId' });
Piece.belongsTo(Campaign, { foreignKey: 'CampaignId' });

// Campaign ⇄ Client (N:N) via CampaignClient
Campaign.belongsToMany(Client, {
  through: CampaignClient,
  foreignKey: 'campaignId',
  as: 'authorizedClients',
});
Client.belongsToMany(Campaign, {
  through: CampaignClient,
  foreignKey: 'clientId',
  as: 'assignedCampaigns',
});

CampaignClient.belongsTo(Campaign, { foreignKey: 'campaignId' });
CampaignClient.belongsTo(Client, { foreignKey: 'clientId' });

// Piece ⇄ Client (revisor)
Piece.belongsTo(Client, { foreignKey: 'reviewedBy', as: 'reviewer' });
Client.hasMany(Piece, { foreignKey: 'reviewedBy', as: 'reviewedPieces' });

/* ========================= EXPORTAÇÃO ========================= */
module.exports = { sequelize, Sequelize, ...sequelize.models };
