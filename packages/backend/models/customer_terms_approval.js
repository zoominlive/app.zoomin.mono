const { Sequelize } = require('sequelize');
const { sequelize } = require('../lib/database');

const CustomerTermsApproval = sequelize.define(
  'customer_terms_approval',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    cust_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    terms_agreed: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    user_fname: {
      type: Sequelize.STRING(30),
      allowNull: false,
    },
    user_lname: {
      type: Sequelize.STRING(30),
      allowNull: false,
    },
    user_email: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
  },
  {
    tableName: 'customer_terms_approval',
    timestamps: true
  }
);

module.exports = CustomerTermsApproval;
