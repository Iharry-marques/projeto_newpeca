// backend/models/index.js - Atualizado com ACL

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
  require('./CampaignClient'), // Novo modelo ACL
];

for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

// Definir associações
const { User, Client, Campaign, Piece, CampaignClient } = sequelize.models;

// Associações existentes
Campaign.hasMany(Piece);
Piece.belongsTo(Campaign);

User.hasMany(Campaign, { foreignKey: 'createdBy' });
Campaign.belongsTo(User, { foreignKey: 'createdBy' });

// NOVAS ASSOCIAÇÕES - ACL Campaign-Client (many-to-many)
Campaign.belongsToMany(Client, { 
  through: CampaignClient,
  foreignKey: 'campaignId',
  otherKey: 'clientId',
  as: 'authorizedClients'
});

Client.belongsToMany(Campaign, { 
  through: CampaignClient,
  foreignKey: 'clientId',
  otherKey: 'campaignId',
  as: 'assignedCampaigns'
});

// Associação direta para facilitar queries
CampaignClient.belongsTo(Campaign, { foreignKey: 'campaignId' });
CampaignClient.belongsTo(Client, { foreignKey: 'clientId' });

// Peça pode ser revisada por um cliente
Piece.belongsTo(Client, { foreignKey: 'reviewedBy', as: 'reviewer' });
Client.hasMany(Piece, { foreignKey: 'reviewedBy', as: 'reviewedPieces' });

module.exports = { sequelize, ...sequelize.models };