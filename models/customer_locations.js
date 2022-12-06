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
    tableName: 'customer_locations',
    timestamps: false
  }
);

module.exports = CustomerLocations;
