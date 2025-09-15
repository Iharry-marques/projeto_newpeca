// backend/models/CampaignClient.js - ACL entre Campaign e Client

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CampaignClient = sequelize.define('CampaignClient', {
    campaignId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Campaigns',
        key: 'id'
      }
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clients',
        key: 'id'
      }
    },
    // Permissões específicas do cliente para esta campanha
    canApprove: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    canComment: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Data de acesso/atribuição
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    // Status específico deste cliente para esta campanha
    clientStatus: {
      type: DataTypes.ENUM('pending', 'viewed', 'completed'),
      defaultValue: 'pending',
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['campaignId', 'clientId']
      }
    ]
  });

  return CampaignClient;
};