const express = require('express');
const app = express();
//const { handleResponses, handleRequests } = require('express-oas-generator');
// const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const openAPIFilePath = './path/to/file.json';
var indexRouter = require('./routes/index');
const { sequelize } = require('./lib/database');
var bodyParser = require('body-parser');
const cors = require('cors');
const { FronteggContext } = require('@frontegg/client');

// Import WebSocket server and cron scheduler
require('./websocket-server');
require('./cron-scheduler');

// Load environment variables
require('dotenv').config();

console.log('Environment variables loaded:', {
  FRONTEGG_CLIENT_ID: process.env.FRONTEGG_CLIENT_ID ? 'Set' : 'Not set',
  FRONTEGG_API_KEY: process.env.FRONTEGG_API_KEY ? 'Set' : 'Not set',
  FRONTEGG_DOMAIN: process.env.FRONTEGG_DOMAIN ? 'Set' : 'Not set',
});

// Debug: Log the actual values (be careful with sensitive data)
console.log('Frontegg Client ID:', process.env.FRONTEGG_CLIENT_ID);
console.log('Frontegg Domain:', process.env.FRONTEGG_DOMAIN);
console.log('Frontegg API Key (first 10 chars):', process.env.FRONTEGG_API_KEY ? process.env.FRONTEGG_API_KEY.substring(0, 10) + '...' : 'Not set');

try {
  FronteggContext.init({
    FRONTEGG_CLIENT_ID: process.env.FRONTEGG_CLIENT_ID,
    FRONTEGG_API_KEY: process.env.FRONTEGG_API_KEY,
  });
  console.log('FronteggContext initialized successfully');
} catch (error) {
  console.error('Error initializing FronteggContext:', error);
}

// Configure CORS properly
app.use(cors({
  origin: "*",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
}));

// To create DB tables from models and sync DB
sequelize.sync();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

/** handle the responses to add openapi specs*/
// if (process.env.NODE_ENV != 'production') {
//   mkdirp.sync(path.parse(openAPIFilePath).dir);

//   let predefinedSpec;

//   try {
//     predefinedSpec = JSON.parse(fs.readFileSync(openAPIFilePath, { encoding: 'utf-8' }));
//   } catch (e) {
//     //
//   }

//   handleResponses(app, {
//     specOutputPath: openAPIFilePath,
//     writeIntervalMs: 1000,
//     predefinedSpec: predefinedSpec ? () => predefinedSpec : undefined
//   });
// }
console.log('reached here==>');
app.use('/', indexRouter);

/** handle the requests to add openapi specs*/
// if (process.env.NODE_ENV != 'production') {
//   handleRequests();
// }



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 