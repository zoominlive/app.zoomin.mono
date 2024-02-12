const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const DefaultSchedule = sequelize.define(
  'default_schedule',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    cust_id: {
      type: Sequelize.STRING(50)
    },
    schedule: { 
      type: Sequelize.JSON, 
      allowNull: true
    },
    location: {
      type: Sequelize.STRING(50),
      allowNull: true
    }, 
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'default_schedule',
    timestamps: true
  }
);

module.exports = DefaultSchedule;
