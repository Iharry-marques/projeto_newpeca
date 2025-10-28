// backend/models/Client.js

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    MasterClientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'MasterClients',
        key: 'id',
      },
    },
    company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Token para acesso direto às campanhas (opcional)
    accessToken: {
      type: DataTypes.STRING,
      unique: true,
    },
  }, {
    hooks: {
      beforeCreate: async (client) => {
        if (client.password) {
          const salt = await bcrypt.genSalt(10);
          client.password = await bcrypt.hash(client.password, salt);
        }
      },
      beforeUpdate: async (client) => {
        if (client.changed('password') && client.password) {
          const salt = await bcrypt.genSalt(10);
          client.password = await bcrypt.hash(client.password, salt);
        }
      },
    },
  });

  // Método para verificar senha
  Client.prototype.validatePassword = async function(password) {
    if (!password || !this.password) return false;
    return bcrypt.compare(password, this.password);
  };

  return Client;
};
