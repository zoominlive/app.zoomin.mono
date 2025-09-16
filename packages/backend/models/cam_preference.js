const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const CamPreference = sequelize.define(
  'cam_preference',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    cust_id: { type: Sequelize.STRING(50), allowNull: false },
    dashboard_cam: {
        type: Sequelize.JSON,
        defaultValue: {}
    },
    watchstream_cam: {
      type: Sequelize.JSON,
      defaultValue: {}
  }
  },
  {
    tableName: 'cam_preference',
    timestamps: false
  }
);

module.exports = CamPreference;
