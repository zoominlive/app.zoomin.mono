const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Customers = sequelize.define(
  'customers',
  {
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    company_name: {
      type: Sequelize.STRING(50)
    },
    address_1: {
      type: Sequelize.STRING(200)
    },
    address_2: {
      type: Sequelize.STRING(200)
    },
    city: {
      type: Sequelize.STRING(20)
    },
    postal: {
      type: Sequelize.STRING(20)
    },
    country: {
      type: Sequelize.STRING(20)
    },
    phone: {
      type: Sequelize.STRING(20)
    },
    billing_contact_first: {
      type: Sequelize.STRING(20)
    },
    billing_contact_last: {
      type: Sequelize.STRING(20)
    },
    max_cameras: {
      type: Sequelize.INTEGER(3)
    },
    available_cameras: {
      type: Sequelize.INTEGER(3)
    },
    max_locations: {
      type: Sequelize.INTEGER(3)
    },
    transcoder_endpoint: {
      type: Sequelize.STRING(155)
    },
    timeout: {
      type: Sequelize.INTEGER(3)
    },
    permit_audio: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' }
  },
  {
    tableName: 'customers',
    timestamps: true
  }
);

module.exports = Customers;
