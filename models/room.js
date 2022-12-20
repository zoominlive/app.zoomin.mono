const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Room = sequelize.define(
  'room',
  {
    room_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    room_name: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    location: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'room',
    timestamps: true
  }
);

module.exports = Room;
