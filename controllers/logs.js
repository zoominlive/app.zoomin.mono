const _ = require('lodash');
const moment = require('moment');
const logServices = require('../services/logs');
const CONSTANTS = require('../lib/constants');
const { sequelize } = require('../lib/database');
module.exports = {
  // get all logs's
  getAllLogs: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.body?.pageNumber,
        pageSize: req.body?.pageSize,
        startDate: req.body?.from ? req.body?.from : moment(),
        endDate: req.body?.to ? req.body?.to : moment(),
        type: req.body?.type,
        functions: req.body?.functions,
        userIds: req.body?.users || [],
        locations: req.body?.locations,
        familyMemberIds: req.body?.familyMemberIds || [],
        actions: req.body?.actions
      };

      const logs = await logServices.getAllLogs(req.user, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: logs,
        Message: CONSTANTS.LOG_DETAILS
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  }
};
