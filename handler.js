const serverless = require('serverless-http');
const express = require('express');
const app = express();
const { handleResponses, handleRequests } = require('express-oas-generator');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const openAPIFilePath = './path/to/file.json';
var indexRouter = require('./routes/index');
const sequelize = require('./lib/database');
var bodyParser = require('body-parser');
const cors = require('cors');
const connectToDatabase = require('./models/index');

app.use(cors());
// To create DB tables from modules and sync DB
sequelize.sync();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

/** handle the responses to add openapi specs*/
if (process.env.NODE_ENV !== 'production') {
  mkdirp.sync(path.parse(openAPIFilePath).dir);

  let predefinedSpec;

  try {
    predefinedSpec = JSON.parse(fs.readFileSync(openAPIFilePath, { encoding: 'utf-8' }));
  } catch (e) {
    //
  }

  handleResponses(app, {
    specOutputPath: openAPIFilePath,
    writeIntervalMs: 1000,
    predefinedSpec: predefinedSpec ? () => predefinedSpec : undefined
  });
}

app.use('/', indexRouter);

/** handle the requests to add openapi specs*/
if (process.env.NODE_ENV !== 'production') {
  handleRequests();
}

module.exports.handler = serverless(app);
