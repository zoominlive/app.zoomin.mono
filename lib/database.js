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
      acquireTimeout: 120000,
      timeout: 120000,
      // Add these for better connection handling
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    logging: false,
    pool: {
      min: 2,           // Increased from 0
      max: 10,          // Increased from 5
      idle: 10000,
      acquire: 120000,
      evict: 30000,
      // Add these for better connection management
      handleDisconnects: true,
      validate: (connection) => {
        return connection.query('SELECT 1');
      }
    },
    retry: {
      max: 5,           // Increased from 3
      timeout: 60000    // Increased from 30000
    },
    // Add these for better error handling
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
      min: 2,           // Increased from 0
      max: 10,          // Increased from 5
      idle: 10000,
      acquire: 120000,
      evict: 30000,
      // Add these for better connection management
      handleDisconnects: true,
      validate: (connection) => {
        return connection.query('SELECT 1');
      }
    },
    retry: {
      max: 5,           // Increased from 3
      timeout: 60000    // Increased from 30000
    }
  }
);

// Test database connections
const testConnections = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error);
  }

  try {
    await postgres.authenticate();
    console.log('✅ PostgreSQL connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error);
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