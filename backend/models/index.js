// Em: backend/models/index.js (VERSÃO FINAL E CORRIGIDA)

const { Sequelize } = require('sequelize');
const config = require('../config').db;

// Inicializa a conexão com o banco de dados
const sequelize = new Sequelize({
  dialect: config.dialect,
  storage: config.storage,
  logging: false, // Desligar os logs do SQL no console para uma visão mais limpa
});

// Lista dos arquivos que definem os modelos
const modelDefiners = [
  require('./User'),
  require('./Client'),
  require('./Campaign'),
  require('./Piece'),
  require('./CampaignClient'),
  require('./CreativeLine'),
];

// Carrega cada modelo na instância do Sequelize
for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

// Extrai os modelos para facilitar a definição das associações
const { User, Client, Campaign, Piece, CampaignClient, CreativeLine } = sequelize.models;

/* =========================== ASSOCIAÇÕES =========================== */
// Define as relações entre as tabelas

// User <-> Campaign (Um usuário cria muitas campanhas)
User.hasMany(Campaign, { foreignKey: 'createdBy', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Campaign <-> CreativeLine (Uma campanha tem muitas linhas criativas)
Campaign.hasMany(CreativeLine, { as: 'creativeLines', foreignKey: 'CampaignId', onDelete: 'CASCADE' });
CreativeLine.belongsTo(Campaign, { foreignKey: 'CampaignId' }); // O alias 'campaign' é opcional aqui

// CreativeLine <-> Piece (Uma linha criativa tem muitas peças)
CreativeLine.hasMany(Piece, { as: 'pieces', foreignKey: 'CreativeLineId', onDelete: 'CASCADE' });
Piece.belongsTo(CreativeLine, { as: 'creativeLine', foreignKey: 'CreativeLineId' }); // Relação inversa necessária

// Campaign <-> Client (Muitos para Muitos, via CampaignClient)
Campaign.belongsToMany(Client, { through: CampaignClient, foreignKey: 'campaignId', as: 'authorizedClients' });
Client.belongsToMany(Campaign, { through: CampaignClient, foreignKey: 'clientId', as: 'assignedCampaigns' });

// Piece <-> Client (Um cliente revisa muitas peças)
Piece.belongsTo(Client, { foreignKey: 'reviewedBy', as: 'reviewer' });
Client.hasMany(Piece, { foreignKey: 'reviewedBy', as: 'reviewedPieces' });


/* ========================= EXPORTAÇÃO ========================= */
// Exporta a instância do Sequelize e todos os modelos
module.exports = {
  sequelize,
  ...sequelize.models
};