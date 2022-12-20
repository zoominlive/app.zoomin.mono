const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const CustomerLocations = sequelize.define(
  'customer_locations',
  {
    loc_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    loc_name: {
      type: Sequelize.STRING(50),
      unique: {
        args: true,
        msg: 'Location name already in use!'
      },
      required: [true, 'Location is mandatory field']
    },
    status: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    cust_id: {
      type: Sequelize.STRING(50)
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'customer_locations',
    timestamps: true
  }
);

module.exports = CustomerLocations;
