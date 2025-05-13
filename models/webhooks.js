const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const Webhooks = sequelize.define(
  'webhooks',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    event: {
      type: Sequelize.STRING,
      allowNull: true
    },
    payload: {
      type: Sequelize.JSON,
      allowNull: true
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
  },
  {
    tableName: 'webhooks',
    timestamps: true,
    paranoid: true
  }
);

module.exports = Webhooks;
