const Sequelize = require('sequelize');

// code to connect sequelize to RDS

let sequelize = new Sequelize(
  process.env.RDS_DB_NAME,
  process.env.RDS_USER,
  process.env.RDS_PASSWORD,
  {
    host: process.env.RDS_HOST,
    port: process.env.RDS_PORT,
    dialect: 'mysql',
    dialectOptions: {
      connectTimeout: 1200000
    },
    logging: false,
    pool: {
      min: 0,
      max: 2,
      idle: 0,
      acquire: 6000,
      evict: 15
    }
  }
);

module.exports = sequelize;
