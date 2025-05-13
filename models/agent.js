const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const Agent = sequelize.define(
  'agent',
  {
    agent_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'agent_id'  // Map to DB column name
    },
    recorded_at: {
      type: Sequelize.DATE,
      allowNull: true
    },
    ip: {
      type: Sequelize.STRING(45), 
      allowNull: true
    },
    hostname: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    container_state: {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'container_state'  // Map to DB column name
    },
    container_version: {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'container_version'  // Map to DB column name as shown in screenshot
    },
    muxly_hostname: {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'muxly_hostname'  // Map to DB column name
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
  },
  {
    tableName: 'agent',
    timestamps: true,
    paranoid: true
  }
);

module.exports = Agent;