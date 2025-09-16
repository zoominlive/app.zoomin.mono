const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const Invoice = sequelize.define(
  'invoice',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    invoice_id: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    stripe_cust_id: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    charge_id: {
      type: Sequelize.STRING(50),
      allowNull: true
    },
    invoice_date: { type: Sequelize.DATE },
    description: {
      type: Sequelize.STRING(250),
      required: false
    },
    quantity: {
      type: Sequelize.INTEGER,
      required: false
    },
    payment_method: {
      type: Sequelize.STRING(50),
      required: false
    },
    amount_paid: {
      type: Sequelize.FLOAT,
      required: false
    },
    amount_due: {
      type: Sequelize.FLOAT,
      required: false
    },
    subtotal: {
      type: Sequelize.FLOAT,
      required: false
    },
    tax: {
      type: Sequelize.FLOAT,
      required: false
    },
    total: {
      type: Sequelize.FLOAT,
      required: false
    },
    status: {
      type: Sequelize.STRING(50),
      required: false
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    // updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
  },
  {
    tableName: 'invoice',
    timestamps: false,
    paranoid: true
  }
);

module.exports = Invoice;
