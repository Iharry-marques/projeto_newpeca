// Em: backend/models/Piece.js (VERSÃO ATUALIZADA PARA R2)

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Piece = sequelize.define('Piece', {
    // --- CAMPOS DE ARMAZENAMENTO (NOVOS) ---
    // storageKey: O nome único do arquivo no R2 (ex: "uuid-123.jpg")
    storageKey: {
      type: DataTypes.STRING,
      allowNull: true, // Permite nulo caso seja só do Drive
    },
    // storageUrl: A URL pública completa do R2 (ex: "https://pub-....r2.dev/uuid-123.jpg")
    storageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true, // Garante que o valor seja uma URL válida
      },
    },

    // --- CAMPO ANTIGO (MODIFICADO) ---
    // filename: Não é mais usado para o caminho do disco, agora é só um fallback.
    filename: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    
    // --- CAMPOS EXISTENTES (SEM MUDANÇA) ---
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
    driveId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
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
