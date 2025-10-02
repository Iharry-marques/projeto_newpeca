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
  require('./CreativeLine'), // Adicionado
];

for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

// Definir associações
const { User, Client, Campaign, Piece, CampaignClient, CreativeLine } = sequelize.models;

User.hasMany(Campaign, { foreignKey: 'createdBy' });
Campaign.belongsTo(User, { foreignKey: 'createdBy' });

// Campanha tem muitas Linhas Criativas
Campaign.hasMany(CreativeLine);
CreativeLine.belongsTo(Campaign);

// Linha Criativa tem muitas Peças
CreativeLine.hasMany(Piece);
Piece.belongsTo(CreativeLine);

// Relação Cliente-Campanha (Muitos para Muitos)
Campaign.belongsToMany(Client, { through: CampaignClient, foreignKey: 'campaignId', as: 'authorizedClients' });
Client.belongsToMany(Campaign, { through: CampaignClient, foreignKey: 'clientId', as: 'assignedCampaigns' });

CampaignClient.belongsTo(Campaign, { foreignKey: 'campaignId' });
CampaignClient.belongsTo(Client, { foreignKey: 'clientId' });

Piece.belongsTo(Client, { foreignKey: 'reviewedBy', as: 'reviewer' });
Client.hasMany(Piece, { foreignKey: 'reviewedBy', as: 'reviewedPieces' });

module.exports = { sequelize, ...sequelize.models };