const Sequelize = require('sequelize');
require('dotenv').config();

// MySQL connection
const sequelize = new Sequelize(
  process.env.RDS_DB_NAME,
  process.env.RDS_USER,
  process.env.RDS_PASSWORD,
  {
    host: process.env.RDS_HOST,
    port: process.env.RDS_PORT,
    dialect: 'mysql',
    dialectOptions: {
      connectTimeout: 1200000,
      // Remove invalid options: acquireTimeout and timeout
      supportBigNumbers: true,
      bigNumberStrings: true,
      // Add SSL configuration if needed
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      // Add charset configuration
      charset: 'utf8mb4',
      // Add additional connection options
      multipleStatements: true
    },
    logging: false,
    pool: {
      min: 2,
      max: 10,
      idle: 10000,
      acquire: 120000,
      evict: 30000,
      handleDisconnects: true,
      validate: (connection) => {
        return connection.query('SELECT 1');
      }
    },
    retry: {
      max: 5,
      timeout: 60000
    },
    define: {
      timestamps: true,
      underscored: true
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
      min: 2,
      max: 10,
      idle: 10000,
      acquire: 120000,
      evict: 30000,
      handleDisconnects: true,
      validate: (connection) => {
        return connection.query('SELECT 1');
      }
    },
    retry: {
      max: 5,
      timeout: 60000
    }
  }
);

// Test database connections with better error handling
const testConnections = async () => {
  console.log('🔍 Testing database connections...');
  console.log(`MySQL Host: ${process.env.RDS_HOST}:${process.env.RDS_PORT}`);
  console.log(`MySQL Database: ${process.env.RDS_DB_NAME}`);
  console.log(`MySQL User: ${process.env.RDS_USER}`);
  
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error.message);
    console.error('Error details:', {
      code: error.parent?.code,
      errno: error.parent?.errno,
      sqlState: error.parent?.sqlState,
      sqlMessage: error.parent?.sqlMessage
    });
  }

  try {
    await postgres.authenticate();
    console.log('✅ PostgreSQL connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error.message);
  }
};

// Test connections on startup
testConnections();

// Add this after database sync
console.log('📊 Database connection pool status:');
setInterval(() => {
  console.log(`MySQL Pool - Used: ${sequelize.connectionManager.pool.size}, Free: ${sequelize.connectionManager.pool.available}`);
}, 30000); // Log every 30 seconds

module.exports = { sequelize, postgres };