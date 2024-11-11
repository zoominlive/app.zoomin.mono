const Sequelize = require('sequelize');
require('dotenv').config();

// code to connect sequelize to RDS

let sequelize = new Sequelize(
  process.env.RDS_DB_NAME_LOCAL,
  process.env.RDS_USER_LOCAL,
  process.env.RDS_PASSWORD_LOCAL,
  {
    host: process.env.RDS_HOST_LOCAL,
    port: process.env.RDS_PORT_LOCAL,
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
