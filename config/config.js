require('dotenv').config();

module.exports = {
  username: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  host: process.env.RDS_HOST,
  dialect: 'mysql'
};
