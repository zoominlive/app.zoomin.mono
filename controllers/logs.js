const _ = require('lodash');
const moment = require('moment');
const logServices = require('../services/logs');
const CONSTANTS = require('../lib/constants');
const sequelize = require('../lib/database');
module.exports = {
  // get all logs's
  getAllLogs: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        startDate: req.query?.from ? req.query?.from : moment(),
        endDate: req.query?.to ? req.query?.to : moment(),
        type: req.query?.type,
        functions: req.query?.functions,
        userIds: req.query?.users || [],
        locations: req.query?.locations,
        familyMemberIds: req.query?.familyMemberIds || [],
        actions: req.query?.actions
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
