const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const Agent = sequelize.define(
  'agent',
  {
    agent_id: {
      type: Sequelize.STRING,
      primaryKey: true,
      field: 'agent_id'
    },
    ip: {
      type: Sequelize.STRING(45),
      allowNull: true
    },
    hostname: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    processor: {
      type: Sequelize.STRING(45),
      allowNull: true
    },
    totalRAM: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    },
    muxly_hostname: {
      type: Sequelize.STRING(255),
      allowNull: true,
      field: 'muxly_hostname'
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