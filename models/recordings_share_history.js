const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const RecordingShareHistory = sequelize.define(
  'recordings_share_history',
  {
    share_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true,
    },
    record_uuid: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    seen: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      required: false
    },
    sender: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    shared_link: {
      type: Sequelize.STRING(1000),
      allowNull: true
    },
    thumbnail_url: {
      type: Sequelize.STRING(1000),
      allowNull: true
    },
    shared_cf_link: {
      type: Sequelize.STRING(1000),
      allowNull: true
    },
    shared_on: {
      type: Sequelize.DATE
    },
    expires_on: {
      type: Sequelize.DATE
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
  },
  {
    tableName: 'recordings_share_history',
    timestamps: true,
    paranoid: true
  }
);

module.exports = RecordingShareHistory;
