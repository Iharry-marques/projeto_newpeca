// Em: backend/models/Piece.js (VERSÃO FINAL)
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Piece = sequelize.define('Piece', {
    storageKey: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'filename', // mantém o nome da coluna existente
    },
    storageUrl: {
      type: DataTypes.STRING(1024),
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
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
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

  // Backwards compatibility: permite acessar piece.filename
  Object.defineProperty(Piece.prototype, 'filename', {
    get() {
      return this.getDataValue('storageKey');
    },
    set(value) {
      this.setDataValue('storageKey', value);
    },
  });

  const originalToJSON = Piece.prototype.toJSON;
  Piece.prototype.toJSON = function toJSON() {
    const data = originalToJSON ? originalToJSON.call(this) : { ...this.get() };
    const storageKey = data.storageKey ?? data.filename ?? null;
    const storageUrl = data.storageUrl ?? null;
    return {
      ...data,
      storageKey,
      storageUrl,
      filename: data.filename ?? storageKey ?? null,
      downloadUrl: data.downloadUrl ?? storageUrl ?? null,
    };
  };

  return Piece;
};
