const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const RecentViewers = sequelize.define(
  'recent_viewers',
  {
    rv_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    source_ip: {
      type: Sequelize.STRING(20),
      allowNull: false
    },
    location_name: {
      type: Sequelize.STRING(20),
      allowNull: false
    },
    lat: {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    },
    long: {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    },
    requested_at: {
      type: 'TIMESTAMP',
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    }
  },
  {
    tableName: 'recent_viewers',
    timestamps: false
  }
);

module.exports = RecentViewers;
