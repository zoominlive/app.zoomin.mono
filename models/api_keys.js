const { Sequelize } = require('sequelize');
const sequelize = require('../lib/database');

const ApiKeys = sequelize.define(
  'api_keys',
  {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    cust_id: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    // secret: {
    //   type: Sequelize.STRING(50),
    //   allowNull: false,
    // },
    // hashedSecret: {
    //   type: Sequelize.STRING(100),
    //   allowNull: false,
    // },
    name: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'API Key'
    },
    email: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    frontegg_user_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    frontegg_tenant_id: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    status: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'active'
    },
    user_id: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    allowed_endpoints: {
      type: Sequelize.JSON,
      allowNull: false,
    },
    location: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    createdAt: { type: Sequelize.DATE, field: 'created_at' },
    updatedAt: { type: Sequelize.DATE, field: 'updated_at' },
    deletedAt: { type: Sequelize.DATE, field: 'deleted_at' },
  },
  {
    tableName: 'api_keys',
    timestamps: true,
    paranoid: true
  }
);

module.exports = ApiKeys;
