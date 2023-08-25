const _ = require('lodash');
const liveStreamServices = require('../services/liveStream');
const CONSTANTS = require('../lib/constants');
const sequelize = require("../lib/database");

module.exports = {
  // get all recording details
  getAllRecordings: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      custId = req.user.cust_id || req.query.cust_id;
      const activeLiveStreams = await liveStreamServices.getAllActiveStreams(custId, req?.query?.location, t);
      const recentLiveStreams = await liveStreamServices.getRecentStreams(custId, req?.query?.location, t);
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {
          activeLiveStreams: activeLiveStreams ? activeLiveStreams : [],
          recentLiveStreams: recentLiveStreams ? recentLiveStreams : [],
        },
        Message: CONSTANTS.RECORDING_DETAILS
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  }
};
