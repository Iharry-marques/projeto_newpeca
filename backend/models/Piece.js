// Em: backend/models/Piece.js

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Piece = sequelize.define('Piece', {
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimetype: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending', // pending, approved, needs_adjustment
    },
    comment: {
      type: DataTypes.TEXT,
    },
  });

  return Piece;
};