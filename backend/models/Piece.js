// Em: backend/models/Piece.js (Código completo atualizado)
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
    status: {
      type: DataTypes.ENUM('uploaded', 'attached', 'pending', 'approved', 'needs_adjustment', 'critical_points'),
      defaultValue: 'uploaded',
    },
    comment: {
      type: DataTypes.TEXT,
    },
    attachedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Clients',
        key: 'id'
      }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // A peça agora pertence a uma Linha Criativa
    CreativeLineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'CreativeLines', // Nome da tabela gerada pelo Sequelize
        key: 'id'
      }
    }
  });

  return Piece;
};