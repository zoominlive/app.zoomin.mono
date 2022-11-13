const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Camera = sequelize.define(
  'camera',
  {
    cam_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    room_ids: {
      type: Sequelize.JSON,
      defaultValue: {},
      allowNull: true
    },
    cam_name: {
      type: Sequelize.STRING(25),
      allowNull: false
    },
    cam_uri: {
      type: Sequelize.STRING(155),
      allowNull: false,
      required: true,
      comment: 'RTSP Stream URL from customer system'
    },
    description: {
      type: Sequelize.STRING(300),
      allowNull: true,
      comment: 'camera description'
    },
    location: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    stream_uri: {
      type: Sequelize.STRING(155),
      allowNull: false,
      required: true,
      comment: 'URI retirned from transcoder'
    },
    stream_uuid: {
      type: Sequelize.STRING(36),
      allowNull: false,
      required: true,
      comment: 'trascoder stream uuid'
    },
    cam_alias: {
      type: Sequelize.STRING(36),
      allowNull: false,
      required: true,
      comment: 'Unless specified by the user use the stream_uuid here'
    },
    created_at: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    },
    updated_at: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    }
  },
  {
    tableName: 'camera',
    timestamps: false
  }
);

module.exports = Camera;
