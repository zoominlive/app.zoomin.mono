const serverless = require('serverless-http');
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

FronteggContext.init({
  FRONTEGG_CLIENT_ID: process.env.FRONTEGG_CLIENT_ID,
  FRONTEGG_API_KEY: process.env.FRONTEGG_API_KEY,
});

app.use(cors({origin: "*"}));

// Handle OPTIONS requests separately
app.options('*', (req, res) => { 
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);  // No Content response
});

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

app.use('/', indexRouter);

/** handle the requests to add openapi specs*/
// if (process.env.NODE_ENV != 'production') {
//   handleRequests();
// }

module.exports.handler = async (event, context) => {
  const serverlessHandler = serverless(app);
  const result = await serverlessHandler(event, context);

  // ✅ Ensure CORS headers are included in the response
  result.headers = {
    ...result.headers,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  return result;
};
