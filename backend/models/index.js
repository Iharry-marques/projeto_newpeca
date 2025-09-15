// backend/models/index.js - Versão atualizada

const { Sequelize } = require('sequelize');
const config = require('../config').db;

const sequelize = new Sequelize({
  dialect: config.dialect,
  storage: config.storage,
  logging: console.log, // Mostra os comandos SQL no console. Útil para depuração.
});

const modelDefiners = [
  require('./User'),
  require('./Client'),
  require('./Campaign'),
  require('./Piece'),
];

for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

// Definir associações
const { User, Client, Campaign, Piece } = sequelize.models;

// Associações existentes
Campaign.hasMany(Piece);
Piece.belongsTo(Campaign);

// Novas associações
User.hasMany(Campaign, { foreignKey: 'createdBy' });
Campaign.belongsTo(User, { foreignKey: 'createdBy' });

// Associação opcional entre Campaign e Client
Client.hasMany(Campaign, { foreignKey: 'clientId' });
Campaign.belongsTo(Client, { foreignKey: 'clientId' });

module.exports = { sequelize, ...sequelize.models };