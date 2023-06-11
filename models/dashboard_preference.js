const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const DashboardPreference = sequelize.define(
  'dashboard_preference',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    cust_id: { type: Sequelize.STRING(50), allowNull: false },
    cam_preference: {
        type: Sequelize.JSON,
        defaultValue: {}
    },
    // createdAt: { type: Sequelize.DATE, field: 'created_at' },
    // updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'dashboard_preference',
    timestamps: false
  }
);

module.exports = DashboardPreference;
