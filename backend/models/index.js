// Em: backend/models/index.js

const { Sequelize } = require('sequelize');
const config = require('../config').db;

const sequelize = new Sequelize({
  dialect: config.dialect,
  storage: config.storage,
  logging: console.log, // Mostra os comandos SQL no console. Útil para depuração.
});

const modelDefiners = [
  require('./User'),
  require('./Campaign'),
  require('./Piece'),
];

for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

module.exports = { sequelize, ...sequelize.models };