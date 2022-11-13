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
    created_at: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    },
    updated_at: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    }
  },
  {
    tableName: 'room',
    timestamps: false
  }
);

module.exports = Room;
