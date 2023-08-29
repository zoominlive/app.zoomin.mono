const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const MountedCameraRecentViewers = sequelize.define(
  'mounted_camera_recent_viewers',
  {
    rv_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    recent_user_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    viewer_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    cam_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    function: {
      type: Sequelize.ENUM('start','stop'),
      allowNull: false
    },
    requested_at: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    }
  },
  {
    tableName: 'mounted_camera_recent_viewers',
    timestamps: false
  }
);

module.exports = MountedCameraRecentViewers;
