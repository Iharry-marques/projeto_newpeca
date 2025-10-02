// Em: backend/models/CreativeLine.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CreativeLine = sequelize.define('CreativeLine', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  return CreativeLine;
};