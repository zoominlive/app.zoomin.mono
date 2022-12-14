const cameraServices = require('../services/cameras');
const familyServices = require('../services/families');
const childrenServices = require('../services/children');
const watchStreamServices = require('../services/watchStream');
const { listAvailableStreams } = require('../lib/rtsp-stream');
const _ = require('lodash');
const sequelize = require('../lib/database');
const CONSTANTS = require('../lib/constants');
module.exports = {
  // get all stream statistics data to populate dashboard
  getStreamStatistics: async (req, res, next) => {
    try {
      params = req.body;
      custId = req.user.cust_id;
      userId = req.user.user_id;
      const token = req.userToken;

      let streams = await listAvailableStreams(token, custId);

      const totalStreams = await cameraServices.getAllCameraForCustomerDashboard(custId);

      let totalActiveStreams = streams?.data?.filter((stream) => {
        return stream.running === true;
      });

      let activeStreams = [];
      totalStreams?.forEach((stream) => {
        totalActiveStreams?.forEach((obj) => {
          if (obj.id === stream.stream_uuid) {
            activeStreams.push(stream);
          }
        });
      });

      let SEAMembers = await familyServices.getFamilyWithSEA(userId);

      let SEAChildren = await childrenServices.getChildrenWithSEA(userId);

      SEAMembers = SEAMembers?.length + SEAChildren.length;

      const recentViewers = await watchStreamServices.getRecentViewers();

      res.status(200).json({
        IsSuccess: true,
        Data: {
          enrolledStreams: totalStreams ? totalStreams.length : 0,
          activeStreams: activeStreams ? activeStreams.length : 0,
          SEAMembers: SEAMembers ? SEAMembers : 0,
          recentViewers: recentViewers ? recentViewers.length : 0,
          enroledStreamsDetails: recentViewers ? recentViewers : 0
        },
        Message: CONSTANTS.STREAM_DATA
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  }
};
