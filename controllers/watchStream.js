const watchStreamServices = require('../services/watchStream');
const customerServices = require('../services/customers');
const _ = require('lodash');
const CONSTANTS = require('../lib/constants');
const logServices = require('../services/logs');
const sequelize = require('../lib/database');
module.exports = {
  // encode stream and create new camera
  getAllCamForLocation: async (req, res, next) => {
    let response;
    try {
      const location = req.query?.location;

      let cameras = await watchStreamServices.getAllCamForLocation(req.user, location);

      const customerDetails = await customerServices.getCustomerDetails(req.user.cust_id);
      cameras = _.uniqBy(cameras, 'room_id');

      cameras?.forEach((cam, camIndex) => {
        cameras[camIndex].timeout = customerDetails.timeout;
      });
      response = { streamDetails: cameras, defaultCams: req.user.cam_preference };
      res.status(200).json({
        IsSuccess: true,
        Data: { streamDetails: cameras, defaultCams: req.user.cam_preference },
        Message: CONSTANTS.CAMERA_DETAILS
      });

      next();
    } catch (error) {
      console.log(error);
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.family_member_id
          ? req?.user?.family_member_id
          : req?.user?.user_id
          ? req?.user?.user_id
          : 'Not Found',
        function: 'Watch_Stream',
        function_type: 'Get',
        response: response
      };
      try {
        await logServices.addAccessLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },
  addRecentViewers: async (req, res, next) => {
    try {
      const params = req.body;
      params.user = req.user;
      const recentViewer = await watchStreamServices.addRecentViewers(params);

      res.status(200).json({
        IsSuccess: true,
        Data: recentViewer,
        Message: CONSTANTS.RECENT_VIEWER_ADDED
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  getAllCamForUser: async (req, res, next) => {
    let response;
    try {
      const camDetails = await watchStreamServices.getAllCamForUser(req.user);

      const customerDetails = await customerServices.getCustomerDetails(req.user.cust_id);

      camDetails?.forEach((room, roomIndex) => {
        camDetails[roomIndex].timeout = customerDetails.timeout;
        room?.cameras?.forEach((cam, camIndex) => {
          camDetails[roomIndex].cameras[camIndex].timeout = customerDetails.timeout;
        });
      });
      response = camDetails;
      res.status(200).json({
        IsSuccess: true,
        Data: camDetails,
        Message: CONSTANTS.CAMERA_DETAILS
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.family_member_id
          ? req?.user?.family_member_id
          : req?.user?.user_id
          ? req?.user?.user_id
          : 'Not Found',
        function: 'Watch_Stream',
        function_type: 'Get',
        response: response
      };
      try {
        await logServices.addAccessLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },
  setUserCamPreference: async (req, res, next) => {
    try {
      let cameras = req?.body?.data ? req?.body?.data : req?.body;

      const addPreferance = await watchStreamServices.setUserCamPreference(req.user, cameras);

      res.status(200).json({
        IsSuccess: true,
        Data: addPreferance,
        Message: CONSTANTS.CAM_PREFERENCE_STORED
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
