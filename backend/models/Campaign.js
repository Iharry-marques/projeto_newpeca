// backend/models/Campaign.js - Versão atualizada com novos estados

const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Campaign = sequelize.define('Campaign', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    client: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    creativeLine: {
      type: DataTypes.STRING,
    },
    startDate: {
      type: DataTypes.DATE,
    },
    endDate: {
      type: DataTypes.DATE,
    },
    approvalHash: {
      type: DataTypes.STRING,
      unique: true,
    },
    // Estados da campanha conforme fluxo
    status: {
      type: DataTypes.ENUM('draft', 'sent_for_approval', 'in_review', 'needs_changes', 'approved'),
      defaultValue: 'draft',
    },
    sentForApprovalAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // ID do usuário Suno que criou
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Observações gerais da campanha
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    hooks: {
      beforeCreate: (campaign) => {
        if (!campaign.approvalHash) {
          campaign.approvalHash = crypto.randomBytes(16).toString('hex');
        }
      },
    },
  });

  return Campaign;
};