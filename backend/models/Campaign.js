// backend/models/Campaign.js - Versão atualizada

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
    approvalHash: { // Link público para aprovação
      type: DataTypes.STRING,
      unique: true,
    },
    // NOVOS CAMPOS
    status: {
      type: DataTypes.ENUM('draft', 'sent_for_approval', 'in_review', 'approved', 'needs_changes'),
      defaultValue: 'draft',
    },
    sentForApprovalAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // ID do usuário Suno que criou
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // ID do cliente que vai aprovar (opcional - pode usar o approvalHash em vez disso)
    clientId: {
      type: DataTypes.INTEGER,
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