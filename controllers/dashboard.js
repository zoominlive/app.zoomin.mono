const cameraServices = require('../services/cameras');
const familyServices = require('../services/families');
const { listAvailableStreams } = require('../lib/rtsp-stream');
const _ = require('lodash');

module.exports = {
  // get all stream statistics data to populate dashboard
  getStreamStatistics: async (req, res, next) => {
    try {
      params = req.body;
      custId = req.user.cust_id;
      userId = req.user.user_id;
      const token = req.userToken;

      const statisticsData = {};

      let streams = await listAvailableStreams(token);

      statisticsData.enroledStreams = streams?.data?.length;

      const activeStreams = streams?.data?.filter((stream) => {
        return stream.running === true;
      });

      statisticsData.activeStreams = activeStreams?.length;

      const SEAMembers = await familyServices.getFamilyWithSEA(userId);

      statisticsData.SEAMembers = SEAMembers?.length;

      res.status(200).json({
        IsSuccess: true,
        Data: statisticsData,
        Message: 'stream statistics data'
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  }
};
