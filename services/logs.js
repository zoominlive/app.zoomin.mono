const connectToDatabase = require('../models/index');

module.exports = {
  /* Create new log*/
  addAccessLog: async (logObj) => {
    const { AccessLogs } = await connectToDatabase();
    let log = await AccessLogs.create(logObj);
    return log;
  },

  addChangeLog: async (logObj) => {
    const { ChangeLogs } = await connectToDatabase();
    let log = await ChangeLogs.create(logObj);
    return log;
  },

  bulkAddChangeLog: async (logObj) => {
    const { ChangeLogs } = await connectToDatabase();
    let log = await ChangeLogs.bulkCreate(logObj);
    return log;
  },
  /* Create new error log*/
  addAccessErrorLog: async (logId, error) => {
    const { AccessLogs } = await connectToDatabase();
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
