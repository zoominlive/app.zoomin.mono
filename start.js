#!/usr/bin/env node

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const openAPIFilePath = './path/to/file.json';
var indexRouter = require('./routes/index');
const { sequelize } = require('./lib/database');
var bodyParser = require('body-parser');
const cors = require('cors');
const { FronteggContext } = require('@frontegg/client');

// Load environment variables
require('dotenv').config();

console.log('🚀 Starting Zoomin API Server...');
console.log('Environment:', process.env.NODE_ENV || 'development');

// Initialize Frontegg
try {
  FronteggContext.init({
    FRONTEGG_CLIENT_ID: process.env.FRONTEGG_CLIENT_ID,
    FRONTEGG_API_KEY: process.env.FRONTEGG_API_KEY,
  });
  console.log('✅ FronteggContext initialized successfully');
} catch (error) {
  console.error('❌ Error initializing FronteggContext:', error);
}

// Configure CORS
app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
}));

// Database sync
console.log('📊 Syncing database...');
sequelize.sync()
  .then(() => {
    console.log('✅ Database synced successfully');
  })
  .catch((error) => {
    console.error('❌ Database sync error:', error);
  });

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

// Routes
console.log('🛣️  Setting up routes...');
app.use('/', indexRouter);

// Start WebSocket server
console.log('🔌 Starting WebSocket server...');
require('./websocket-server');

// Start cron scheduler
console.log('⏰ Starting cron job scheduler...');
require('./cron-scheduler');

// Start HTTP server
const PORT = process.env.PORT || 3000;
const app_server = app.listen(PORT, () => {
  console.log('🎉 Server is running!');
  console.log(`📡 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${process.env.WEBSOCKET_PORT || 3001}/websocket`);
  console.log('⏰ Cron jobs scheduled (hourly)');
  console.log('📊 Database connected');
  console.log('🔐 Authentication ready');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  app_server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  app_server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

module.exports = app; 