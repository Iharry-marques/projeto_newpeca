// Em: backend/models/Campaign.js

const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const Campaign = sequelize.define(
    'Campaign',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      MasterClientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'MasterClients',
          key: 'id',
        },
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
      status: {
        type: DataTypes.STRING,
        defaultValue: 'draft',
        validate: {
          isIn: [['draft', 'sent_for_approval', 'approved', 'needs_changes', 'in_review']],
        },
      },
      approvalHash: {
        type: DataTypes.STRING,
        unique: true,
      },
      sentForApprovalAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      hooks: {
        beforeCreate: (campaign) => {
          if (!campaign.approvalHash) {
            campaign.approvalHash = crypto.randomBytes(16).toString('hex');
          }
        },
      },
      tableName: 'Campaigns',
    }
  );

  return Campaign;
};
