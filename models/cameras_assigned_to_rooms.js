const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const CamerasInRooms = sequelize.define(
  'cameras_assigned_to_rooms',
  {
    cam_room_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    cam_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    room_id: {
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
    tableName: 'cameras_assigned_to_rooms',
    timestamps: true
  }
);

module.exports = CamerasInRooms;
