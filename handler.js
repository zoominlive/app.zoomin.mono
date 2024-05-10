const serverless = require('serverless-http');
const express = require('express');
const app = express();
//const { handleResponses, handleRequests } = require('express-oas-generator');
// const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const openAPIFilePath = './path/to/file.json';
var indexRouter = require('./routes/index');
const sequelize = require('./lib/database');
var bodyParser = require('body-parser');
const cors = require('cors');
const { FronteggContext } = require('@frontegg/client');

FronteggContext.init({
  FRONTEGG_CLIENT_ID: 'abff20d3-c32c-43b9-ada5-7c56a9349a7b',
  FRONTEGG_API_KEY: '05200ba2-93e1-456c-baee-80a1e2614a92',
});

app.use(cors());
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

module.exports.handler = serverless(app);
