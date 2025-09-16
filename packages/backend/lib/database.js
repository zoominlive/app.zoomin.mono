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
      connectTimeout: 30000,
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
      min: process.env.NODE_ENV === 'production' ? 1 : 2,
      max: process.env.NODE_ENV === 'production' ? 20 : 30,
      idle: 5000,
      acquire: 30000,
      evict: 10000
    },
    retry: {
      max: 3,
    },
    define: {
      timestamps: true,
      underscored: true
    },
    // Add query timeout
    query: {
      timeout: 30000
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
      min: 1,
      max: 5,
      idle: 5000,
      acquire: 60000,
      evict: 10000
    },
    retry: {
      max: 2,
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

// Enhanced connection pool monitoring with better frequency
console.log('📊 Database connection pool status:');
setInterval(() => {
  try {
    const TransactionHelper = require('./transaction-helper');
    const status = TransactionHelper.getPoolStatus();
    const utilization = status.utilization || 0;
    
    console.log(`MySQL Pool - Used: ${status.borrowed}/${status.max} (${utilization.toFixed(1)}%), Free: ${status.available}, Pending: ${status.pending}`);
    
    if (utilization > 80) {
      console.warn('⚠️ MySQL connection pool is getting full!');
    }
    
    if (utilization > 95) {
      console.error('🚨 MySQL connection pool is critically full!');
    }
  } catch (e) {
    // Avoid crashing on monitoring errors
    console.warn('Pool monitoring error:', e.message);
  }
}, 15000); // Log every 15 seconds instead of 30

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('🔄 Closing database connections...');
  await sequelize.close();
  await postgres.close();
  console.log('✅ Database connections closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing database connections...');
  await sequelize.close();
  await postgres.close();
  console.log('✅ Database connections closed');
  process.exit(0);
});

module.exports = { sequelize, postgres };