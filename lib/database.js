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
      connectTimeout: 10000
    },
    pool: {
      min: 5,
      idle: 10000
    }
  }
);

module.exports = sequelize;
