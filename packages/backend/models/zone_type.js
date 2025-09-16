const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const ZoneType = sequelize.define(
  'zone_type',
  {
    zone_type_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    zone_type: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
  },
  {
    tableName: 'zone_type',
    timestamps: true,
    paranoid: true
  }
);

module.exports = ZoneType;
