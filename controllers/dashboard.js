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

      let statisticsData = {};

      let streams = await listAvailableStreams(token);

      const enroledStreams = streams?.data?.length;

      let activeStreams = streams?.data?.filter((stream) => {
        return stream.running === true;
      });

      activeStreams = activeStreams?.length;

      let SEAMembers = await familyServices.getFamilyWithSEA(userId);

      SEAMembers = SEAMembers?.length;

      res.status(200).json({
        IsSuccess: true,
        Data: {
          enroledStreams: enroledStreams ? enroledStreams : 0,
          activeStreams: activeStreams ? activeStreams : 0,
          SEAMembers: SEAMembers ? SEAMembers : 0
        },
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
