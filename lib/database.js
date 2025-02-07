const Sequelize = require('sequelize');
require('dotenv').config();

// code to connect sequelize to RDS

let sequelize = new Sequelize(
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

module.exports = sequelize;
