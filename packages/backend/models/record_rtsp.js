const { Sequelize } = require("sequelize");
const { sequelize } = require('../lib/database');

// Make sure sequelize is a Sequelize instance
if (!sequelize || !sequelize.define) {
  throw new Error('Invalid Sequelize instance. Check database.js exports.');
}

const RecordRtsp = sequelize.define(
  "record_rtsp",
  {
    record_uuid: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    zone_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    zone_name: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    event_name: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    thumbnail_url: {
      type: Sequelize.STRING(250),
      allowNull: true,
    },
    video_url: {
      type: Sequelize.STRING(250),
      allowNull: true,
    },
    cam_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      required: false,
    },
    start_time: {
      type: Sequelize.DATE,
      defaultValue: null,
    },
    stop_time: {
      type: Sequelize.DATE,
      defaultValue: null,
    },
    duration: {
      type: Sequelize.INTEGER,
      defaultValue: null,
    },
    tag_id: {
      type: Sequelize.STRING(250),
      defaultValue: null,
      allowNull: true,
    },
    createdAt: { type: Sequelize.DATE, field: "created_at" },
    updatedAt: { type: Sequelize.DATE, field: "updated_at" },
    deletedAt: { type: Sequelize.DATE, field: "deleted_at" },
  },
  {
    tableName: "record_rtsp",
    timestamps: true,
    paranoid: true,
  }
);

module.exports = RecordRtsp;
