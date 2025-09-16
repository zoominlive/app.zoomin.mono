const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const ZonesInChild = sequelize.define(
  'zones_assigned_to_child',
  {
    zone_child_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    child_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    zone_id: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    disabled: {
      type: Sequelize.ENUM('true', 'false'),
      defaultValue: 'true'
    },
    scheduled_disable_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null
    },
    scheduled_enable_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null
    },
    schedule: { type: Sequelize.JSON, defaultValue: {}, allowNull: true },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'zones_assigned_to_child',
    timestamps: true
  }
);

module.exports = ZonesInChild;
