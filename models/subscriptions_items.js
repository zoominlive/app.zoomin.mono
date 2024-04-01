const { Sequeoducte } = require('sequelize');
const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const SubscriptionItems = sequelize.define(
  'subscription_items',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    subscription_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    stripe_id: {
      type: Sequelize.STRING(50),
      required: [true, 'Stripe ID is mandatory field']
    },
    stripe_product: {
      type: Sequelize.STRING(50),
    },
    stripe_price: {
      type: Sequelize.STRING(50),
    },
    quantity: {
      type: Sequelize.INTEGER,
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
  },
  {
    tableName: 'subscription_items',
    timestamps: true,
    paranoid: true
  }
);

module.exports = SubscriptionItems;
