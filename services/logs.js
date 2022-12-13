const { AccessLogs, ChangeLogs } = require('../models/index');
const Sequelize = require('sequelize');

const sequelize = require('../lib/database');

module.exports = {
  /* Create new log*/
  addAccessLog: async (logObj) => {
    let log = await AccessLogs.create(logObj);
    return log;
  },

  addChangeLog: async (logObj) => {
    let log = await ChangeLogs.create(logObj);
    return log;
  },
  /* Create new error log*/
  addAccessErrorLog: async (logId, error) => {
    let errorLog = await AccessLogs.update(
      { error: error },
      {
        where: {
          log_id: logId
        }
      }
    );
    return errorLog;
  }
};
