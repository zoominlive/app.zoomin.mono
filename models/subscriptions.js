const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const Subscriptions = sequelize.define(
  'subscriptions',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    plan: {
      type: Sequelize.STRING(30),
      required: [false, 'Subscription plan is mandatory field']
    },
    product_name: {
      type: Sequelize.STRING(30),
      required: [false, 'Subscription plan is mandatory field']
    },
    scheduled: {
      type: Sequelize.BOOLEAN(1),
      defaultValue: false
    },
    stripe_id: {
      type: Sequelize.STRING(50),
      required: [true, 'Stripe ID is mandatory field']
    },
    stripe_status: {
      type: Sequelize.STRING(50),
      required: false
    },
    stripe_price: {
      type: Sequelize.STRING(50),
    },
    quantity: {
      type: Sequelize.INTEGER,
    },
    starts_at: { type: Sequelize.DATE },
    ends_at: { type: Sequelize.DATE },
    trial_starts_at: { type: Sequelize.DATE },
    trial_ends_at: { type: Sequelize.DATE },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' },
  },
  {
    tableName: 'subscriptions',
    timestamps: true,
    paranoid: true
  }
);

module.exports = Subscriptions;
