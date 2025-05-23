const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const AgentContainers = sequelize.define(
  "agent_containers",
  {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    container_id: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    container_version: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    container_state: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    agent_id: {
      type: Sequelize.STRING,
      allowNull: false,
      onDelete: "CASCADE",
    },
    createdAt: { type: Sequelize.DATE, field: "created_at" },
    updatedAt: { type: Sequelize.DATE, field: "updated_at" },
    deletedAt: { type: Sequelize.DATE, field: "deleted_at" },
  },
  {
    tableName: "agent_containers",
    timestamps: true,
    paranoid: true,
  }
);

module.exports = AgentContainers;
