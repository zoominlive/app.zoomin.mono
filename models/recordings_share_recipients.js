const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const RecordingShareRecipients = sequelize.define(
  'recordings_share_recipients',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    share_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
  },
  {
    tableName: 'recordings_share_recipients',
    timestamps: true,
    paranoid: true
  }
);


module.exports = RecordingShareRecipients;
