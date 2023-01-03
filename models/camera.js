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
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'camera',
    timestamps: true
  }
);

module.exports = Camera;
