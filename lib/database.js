const Sequelize = require('sequelize');
require('dotenv').config();

// MySQL connection
const sequelize = new Sequelize(
  process.env.RDS_DB_NAME_STAGE,
  process.env.RDS_USER_STAGE,
  process.env.RDS_PASSWORD_STAGE,
  {
    host: process.env.RDS_HOST_STAGE,
    port: process.env.RDS_PORT_STAGE,
    dialect: 'mysql',
    dialectOptions: {
      connectTimeout: 1200000
    },
    logging: false,
    pool: {
      min: 0,
      max: 2,
      idle: 0,
      acquire: 60000,
      evict: 15
    }
  }
);

// PostgreSQL connection
const postgres = new Sequelize(
  process.env.POSTGRES_DB_NAME_STAGE,
  process.env.POSTGRES_USER_STAGE,
  process.env.POSTGRES_PASSWORD_STAGE,
  {
    host: process.env.POSTGRES_HOST_STAGE,
    port: process.env.POSTGRES_PORT_STAGE,
    dialect: 'postgres',
    logging: false,
    pool: {
      min: 0,
      max: 2,
      idle: 0,
      acquire: 60000,
      evict: 15
    }
  }
);

module.exports = { sequelize, postgres };