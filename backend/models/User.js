// Em: backend/models/User.js

const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: { // Usaremos o e-mail como username
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: { // Obrigatório pelo modelo, mas não usado no login OAuth
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'collaborator', // 'admin' ou 'collaborator'
    },
  }, {
    hooks: {
      // Este "hook" criptografa a senha automaticamente antes de salvar
      // Será útil se você decidir implementar o login manual.
      beforeCreate: async (user) => {
        if (user.password && user.password !== 'oauth') {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  });

  return User;
};