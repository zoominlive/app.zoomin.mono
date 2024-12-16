const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Zone = sequelize.define(
  'zone',
  {
    zone_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    zone_name: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
  },
  {
    tableName: 'zone',
    timestamps: true,
    paranoid: true
  }
);

module.exports = Zone;
