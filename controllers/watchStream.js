const watchStreamServices = require('../services/watchStream');
const customerServices = require('../services/customers');
const _ = require('lodash');
const CONSTANTS = require('../lib/constants');
const logServices = require('../services/logs');
const dashboardServices = require('../services/dashboard');
const sequelize = require('../lib/database');
module.exports = {
  // encode stream and create new camera
  getAllCamForLocation: async (req, res, next) => {
    let response;
    try {
      if (req.user.role == 'Family') {
        let accessableLocsToFamily
        if(req.user.cust_id){
          accessableLocsToFamily = req.user?.location?.accessable_locations?.filter((loc) => {
            if (!req.user?.disabled_locations?.locations?.find((loc1) => loc1 == loc)) {
              return loc;
            }
          });
        }
        else{
          let availableLocations = await customerServices.getLocationDetails(req.query?.cust_id)
          let locs = availableLocations.flatMap((i) => i.loc_name);
          accessableLocsToFamily = locs?.filter((loc) => {
            if (!req.user?.disabled_locations?.locations?.find((loc1) => loc1 == loc)) {
              return loc;
            }
          });
        }
        req.user.location.accessable_locations = accessableLocsToFamily;
      }
      let cameras = await watchStreamServices.getAllCamForLocation({...req.user, cust_id: req.user.cust_id || req.query?.cust_id});
      
      const customerDetails = await customerServices.getCustomerDetails(req.user.cust_id || req.query?.cust_id);
      cameras = _.uniqBy(cameras, 'room_id');

      cameras?.forEach((cam, camIndex) => {
        cameras[camIndex].timeout = customerDetails.timeout;
        cameras[camIndex].permit_audio = customerDetails.permit_audio;
      });
      let defaultCams = req.user.cam_preference
      if (req.user.role === "Super Admin") {
        let watchStream = await watchStreamServices.getCamPreference(req.query?.cust_id);
        defaultCams = watchStream || {};
      }

      response = { streamDetails: cameras, defaultCams: defaultCams };
      res.status(200).json({
        IsSuccess: true,
        Data: { streamDetails: cameras, defaultCams: defaultCams },
        Message: CONSTANTS.CAMERA_DETAILS
      });

      next();
    } catch (error) {
      console.log(error);
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
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
      await dashboardServices.updateDashboardData(params.user.cust_id);
      res.status(200).json({
        IsSuccess: true,
        Data: recentViewer,
        Message: CONSTANTS.RECENT_VIEWER_ADDED
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
  },

  getAllCamForUser: async (req, res, next) => {
    let response;
    try {
      if (req.user.role == 'Family') {
        let accessableLocsToFamily = req.user?.location?.accessable_locations?.filter((loc) => {
          if (!req.user?.disabled_locations?.locations?.find((loc1) => loc1 == loc)) {
            return loc;
          }
        });
        req.user.location.accessable_locations = accessableLocsToFamily;
      }
      const camDetails = await watchStreamServices.getAllCamForUser({...req.user, cust_id: req.user.cust_id  || req.query?.cust_id});

      const customerDetails = await customerServices.getCustomerDetails(req.user.cust_id || req.query?.cust_id);

      camDetails?.forEach((room, roomIndex) => {
        camDetails[roomIndex].timeout = customerDetails.timeout;
        camDetails[roomIndex].permit_audio = customerDetails.permit_audio;
        room?.cameras?.forEach((cam, camIndex) => {
          camDetails[roomIndex].cameras[camIndex].permit_audio = customerDetails.permit_audio;
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
        error_log: error,
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
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  ReportViewers: async (req, res, next) => {
    try {
      const params = req.body;
      const custId = req?.user?.cust_id || req?.body?.cust_id;
      const recentViewer = await watchStreamServices.reportViewers(params);
      await dashboardServices.updateDashboardData(custId);
      res.status(200).json({
        IsSuccess: true,
        Data: recentViewer,
        Message: CONSTANTS.RECENT_VIEWER_ADDED
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
