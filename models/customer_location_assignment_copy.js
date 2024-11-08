const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const CustomerLocationAssignmentsCopy = sequelize.define(
  'customer_location_assignments_copy', 
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: Sequelize.STRING(50),
    },
    family_member_id: {
      type: Sequelize.STRING(50),
    },
    family_id: {
      type: Sequelize.STRING(50),
    },
    child_id: {
      type: Sequelize.STRING(50),
    },
    cust_id: {
      type: Sequelize.STRING(50)
    },
    loc_id: {
      type: Sequelize.INTEGER
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'customer_location_assignments_copy',
    timestamps: true
  }
);

module.exports = CustomerLocationAssignmentsCopy;
