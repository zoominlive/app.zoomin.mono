const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Sessions = sequelize.define(
  'sessions',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    token: {
      type: Sequelize.STRING(1600),
      allowNull: true
    },
    isExpired: {
      type: Sequelize.BOOLEAN(1),
      defaultValue: false
    },
    isLoggedIn: {
      type: Sequelize.BOOLEAN(1),
      defaultValue: false
    },
    user_agent: {
      type: Sequelize.STRING(155),
      allowNull: true
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
  },
  {
    tableName: 'sessions',
    timestamps: true  
  }
);

module.exports = Sessions;
