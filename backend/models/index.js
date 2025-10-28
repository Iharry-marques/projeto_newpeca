const { Sequelize } = require('sequelize');

const connectionUri = process.env.DATABASE_URL;
let sequelize;

if (connectionUri) {
  sequelize = new Sequelize(connectionUri, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions:
      process.env.NODE_ENV === 'production'
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
  });
} else {
  console.warn('[DB] DATABASE_URL não definida, usando config.js como fallback.');
  const config = require('../config').db;
  sequelize = new Sequelize({
    dialect: config.dialect || 'sqlite',
    storage: config.storage || 'database.sqlite',
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

for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
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

User.hasMany(Campaign, { as: 'campaigns', foreignKey: 'createdBy' });
Campaign.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

Campaign.hasMany(CreativeLine, {
  as: 'creativeLines',
  foreignKey: 'CampaignId',
  onDelete: 'CASCADE',
});
CreativeLine.belongsTo(Campaign, { as: 'campaign', foreignKey: 'CampaignId' });

CreativeLine.hasMany(Piece, {
  as: 'pieces',
  foreignKey: 'CreativeLineId',
  onDelete: 'CASCADE',
});
Piece.belongsTo(CreativeLine, { as: 'creativeLine', foreignKey: 'CreativeLineId' });

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

Piece.belongsTo(Client, {
  as: 'reviewer',
  foreignKey: 'reviewedBy',
  constraints: false,
});
Client.hasMany(Piece, { as: 'reviewedPieces', foreignKey: 'reviewedBy' });

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
