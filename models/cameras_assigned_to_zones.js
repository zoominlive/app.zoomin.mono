const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const CamerasInZones = sequelize.define(
  'cameras_assigned_to_zones',
  {
    cam_zone_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    cam_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    zone_id: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    hls_url: {
      type: Sequelize.STRING(500),
      allowNull: true
    },
    disabled: {
      type: Sequelize.ENUM('true', 'false'),
      defaultValue: 'false'
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'cameras_assigned_to_zones',
    timestamps: true
  }
);

module.exports = CamerasInZones;
