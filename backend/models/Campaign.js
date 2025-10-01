// Em: backend/models/Campaign.js

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
    // ADICIONE ESTE CAMPO
    status: {
      type: DataTypes.STRING,
      defaultValue: 'draft', // Ex: 'draft', 'sent_for_approval', 'approved'
    },
    approvalHash: { 
      type: DataTypes.STRING,
      unique: true,
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