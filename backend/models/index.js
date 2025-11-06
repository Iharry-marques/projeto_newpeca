const { Sequelize } = require('sequelize');
const config = require('../config').db;

let sequelize;

if (config.connectionString) {
  // Produção (Render) usa a string de conexão completa
  sequelize = new Sequelize(config.connectionString, {
    dialect: config.dialect || 'postgres',
    dialectOptions: config.dialectOptions,
    logging: false,
  });
} else {
  // Fallback local (ex.: SQLite)
  sequelize = new Sequelize({
    dialect: config.dialect,
    storage: config.storage,
    logging: false,
  });
}

const modelDefiners = [
  require('./User'),
  require('./MasterClient'),
  require('./Client'),
  require('./Campaign'),
  require('./Piece'),
  require('./CampaignClient'),
  require('./CreativeLine'),
];

for (const defineModel of modelDefiners) {
  defineModel(sequelize);
}

const {
  User,
  MasterClient,
  Client,
  Campaign,
  Piece,
  CampaignClient,
  CreativeLine,
} = sequelize.models;

// User <-> Campaign
User.hasMany(Campaign, { as: 'campaigns', foreignKey: 'createdBy' });
Campaign.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Campaign <-> CreativeLine
Campaign.hasMany(CreativeLine, {
  as: 'creativeLines',
  foreignKey: 'CampaignId',
  onDelete: 'CASCADE',
});
CreativeLine.belongsTo(Campaign, { as: 'campaign', foreignKey: 'CampaignId' });

// CreativeLine <-> Piece
CreativeLine.hasMany(Piece, {
  as: 'pieces',
  foreignKey: 'CreativeLineId',
  onDelete: 'CASCADE',
});
Piece.belongsTo(CreativeLine, { as: 'creativeLine', foreignKey: 'CreativeLineId' });

// Campaign <-> Client (Muitos-para-Muitos)
Campaign.belongsToMany(Client, {
  through: CampaignClient,
  as: 'authorizedClients',
  foreignKey: 'campaignId',
  onDelete: 'CASCADE',
});
Client.belongsToMany(Campaign, {
  through: CampaignClient,
  as: 'assignedCampaigns',
  foreignKey: 'clientId',
  onDelete: 'CASCADE',
});

// Piece <-> Client (Revisor)
Piece.belongsTo(Client, {
  as: 'reviewer',
  foreignKey: 'reviewedBy',
  constraints: false,
});
Client.hasMany(Piece, { as: 'reviewedPieces', foreignKey: 'reviewedBy' });

// MasterClient relações
MasterClient.hasMany(Campaign, {
  as: 'campaigns',
  foreignKey: 'MasterClientId',
});
Campaign.belongsTo(MasterClient, {
  as: 'masterClient',
  foreignKey: 'MasterClientId',
});

MasterClient.hasMany(Client, {
  as: 'clientUsers',
  foreignKey: 'MasterClientId',
});
Client.belongsTo(MasterClient, {
  as: 'masterClient',
  foreignKey: 'MasterClientId',
});

module.exports = { sequelize, ...sequelize.models };
