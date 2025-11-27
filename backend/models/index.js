// Em: backend/models/index.js (VERSÃO FINAL E CORRIGIDA)

const { Sequelize } = require('sequelize');
const config = require('../config').db;

const sequelize = config.url
  ? new Sequelize(config.url, {
      dialect: config.dialect,
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Render/managed PG usa certificados self-signed
        },
      },
    })
  : new Sequelize({
      dialect: config.dialect,
      storage: config.storage,
      logging: false, // Desligado para um console mais limpo
    });

// Carrega todos os modelos
const modelDefiners = [
  require('./User'), require('./Client'), require('./Campaign'),
  require('./Piece'), require('./CampaignClient'), require('./CreativeLine'),
];
for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

// Extrai os modelos para facilitar a definição das associações
const { User, Client, Campaign, Piece, CampaignClient, CreativeLine } = sequelize.models;

/* =========================== ASSOCIAÇÕES =========================== */

// User <-> Campaign
User.hasMany(Campaign, { as: 'campaigns', foreignKey: 'createdBy' });
Campaign.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Campaign <-> CreativeLine
Campaign.hasMany(CreativeLine, { as: 'creativeLines', foreignKey: 'CampaignId', onDelete: 'CASCADE' });
CreativeLine.belongsTo(Campaign, { as: 'campaign', foreignKey: 'CampaignId' });

// CreativeLine <-> Piece
CreativeLine.hasMany(Piece, { as: 'pieces', foreignKey: 'CreativeLineId', onDelete: 'CASCADE' });
Piece.belongsTo(CreativeLine, { as: 'creativeLine', foreignKey: 'CreativeLineId' });

// Campaign <-> Client (Muitos-para-Muitos)
Campaign.belongsToMany(Client, { through: CampaignClient, as: 'authorizedClients', foreignKey: 'campaignId' });
Client.belongsToMany(Campaign, { through: CampaignClient, as: 'assignedCampaigns', foreignKey: 'clientId' });

// Piece <-> Client (Revisor)
Piece.belongsTo(Client, { as: 'reviewer', foreignKey: 'reviewedBy' });
Client.hasMany(Piece, { as: 'reviewedPieces', foreignKey: 'reviewedBy' });


/* ========================= EXPORTAÇÃO ========================= */
module.exports = { sequelize, ...sequelize.models };
