// backend/models/MasterClient.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MasterClient = sequelize.define('MasterClient', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Garante que cada nome de empresa/marca seja único
      validate: {
        notEmpty: true, // Não permite strings vazias
      }
    },
  }, {
    // Opções do modelo
    tableName: 'MasterClients', // Nome explícito da tabela (pluralizado)
    timestamps: true, // Mantém createdAt e updatedAt
  });

  return MasterClient;
};