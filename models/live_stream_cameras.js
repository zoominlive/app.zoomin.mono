const { Sequelize } = require("sequelize");
const sequelize = require("../lib/database");

const LiveStreamCameras = sequelize.define(
  "live_stream_cameras",
  {
    cam_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    cam_name: {
      type: Sequelize.STRING(25),
      allowNull: false,
    },
    zone_id: {
      type: Sequelize.STRING(50),
    },
    stream_uri: {
      type: Sequelize.STRING(155),
      allowNull: false,
      required: true,
    },

    createdAt: { type: Sequelize.DATE, field: "created_at" },
    updatedAt: { type: Sequelize.DATE, field: "updated_at" },
  },
  {
    tableName: "live_stream_cameras",
    timestamps: true,
  }
);

module.exports = LiveStreamCameras;
