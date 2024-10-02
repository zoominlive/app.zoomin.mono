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
        name: 'unique_cust_id',
        args: true,
        msg: 'Location name already in use!'
      },
      required: [true, 'Location is mandatory field']
    },
    transcoder_endpoint: {
      type: Sequelize.STRING(155)
    },
    status: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    time_zone: {
      type: Sequelize.STRING(100)
    },
    cust_id: {
      type: Sequelize.STRING(50),
      unique: {
        name: 'unique_cust_id',
        args: true,
        msg: 'Cust Id already in use!'
      },
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' }
  },
  {
    tableName: 'customer_locations',
    timestamps: true,
    paranoid: true
  }
);

module.exports = CustomerLocations;
