const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const SocketConnection = sequelize.define(
  'socket_connection',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    endpoint: {
      type: Sequelize.STRING(500),
      allowNull: true
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'socket_connection',
    timestamps: true
  }
);

module.exports = SocketConnection;
