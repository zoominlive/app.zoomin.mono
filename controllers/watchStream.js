const watchStreamServices = require('../services/watchStream');
const customerServices = require('../services/customers');
const _ = require('lodash');
const CONSTANTS = require('../lib/constants');

module.exports = {
  // encode stream and create new camera
  getAllCamForLocation: async (req, res, next) => {
    try {
      const location = req.query?.location;

      let cameras = await watchStreamServices.getAllCamForLocation(req.user, location);

      const customerDetails = await customerServices.getCustomerDetails(req.user.cust_id);
      cameras = _.uniqBy(cameras, 'room_id');

      cameras?.forEach((cam, camIndex) => {
        cameras[camIndex].timeout = customerDetails.timeout;
      });

      res.status(200).json({
        IsSuccess: true,
        Data: cameras,
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
    try {
      const camDetails = await watchStreamServices.getAllCamForUser(req.user);

      const customerDetails = await customerServices.getCustomerDetails(req.user.cust_id);

      camDetails?.forEach((room, roomIndex) => {
        camDetails[roomIndex].timeout = customerDetails.timeout;
        room?.cameras?.forEach((cam, camIndex) => {
          camDetails[roomIndex].cameras[camIndex].timeout = customerDetails.timeout;
        });
      });

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
    }
  }
};
