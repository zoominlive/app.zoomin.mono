const { Sequelize } = require("sequelize");
const { sequelize } = require("../lib/database");

const FcmTokens = sequelize.define(
  "fcm_tokens",
  {
    id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    device_type: {
      type: Sequelize.ENUM("ios", "android"),
      default: null,
      allowNull: true,
    },
    fcm_token: {
      type: Sequelize.STRING(250),
      default: null,
      allowNull: true,
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    family_member_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    createdAt: { type: Sequelize.DATE, field: "created_at" },
    updatedAt: { type: Sequelize.DATE, field: "updated_at" },
  },
  {
    tableName: "fcm_tokens",
    timestamps: true,
  }
);

module.exports = FcmTokens;
