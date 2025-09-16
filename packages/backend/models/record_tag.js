const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const RecordTag = sequelize.define(
  'record_tag',
  {
    tag_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    tag_name: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    status: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
  },
  {
    tableName: 'record_tag',
    timestamps: true,
    paranoid: true
  }
);

module.exports = RecordTag;
