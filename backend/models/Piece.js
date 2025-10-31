// Em: backend/models/Piece.js (VERSÃO FINAL)
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Piece = sequelize.define('Piece', {
    filename: {
      type: DataTypes.STRING,
      // Não é mais obrigatório, pois podemos ter peças só do Drive
      allowNull: true,
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
    // NOVO CAMPO para rastrear arquivos do Google Drive
    driveId: {
      type: DataTypes.STRING,
      allowNull: true,
      // unique removido para permitir reutilizar o mesmo arquivo do Drive em múltiplas peças
    },
    driveFileId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('uploaded', 'attached', 'pending', 'approved', 'needs_adjustment', 'critical_points', 'imported'),
      defaultValue: 'uploaded',
    },
    comment: {
      type: DataTypes.TEXT,
    },
    reviewedAt: {
      type: DataTypes.DATE,
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      references: { model: 'Clients', key: 'id' }
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    CreativeLineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'CreativeLines',
        key: 'id'
      }
    }
  });

  return Piece;
};
