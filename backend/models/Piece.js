// backend/models/Piece.js - Atualizado com novos estados

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Piece = sequelize.define('Piece', {
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mimetype: {
      type: DataTypes.STRING,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Estados da peça conforme fluxo
    status: {
      type: DataTypes.ENUM('uploaded', 'attached', 'pending', 'approved', 'needs_adjustment', 'critical_points'),
      defaultValue: 'uploaded', // Primeiro estado após upload
    },
    // Comentários do cliente
    comment: {
      type: DataTypes.TEXT,
    },
    // Data de anexação à campanha
    attachedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Data de aprovação/feedback
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Cliente que fez a revisão
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Clients',
        key: 'id'
      }
    },
    // Ordem/posição da peça na campanha
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });

  return Piece;
};