const Sequelize = require('sequelize');

// code to connect sequelize to RDS

let sequelize = new Sequelize(
  process.env.RDS_DB_NAME,
  process.env.RDS_USER,
  process.env.RDS_PASSWORD,
  {
    host: process.env.RDS_HOST,
    port: process.env.RDS_PORT,
    dialect: 'mysql'
  }
);

module.exports = sequelize;
