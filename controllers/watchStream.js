const watchStreamServices = require('../services/watchStream');
const _ = require('lodash');

module.exports = {
  // encode stream and create new camera
  getAllCamForLocation: async (req, res, next) => {
    try {
      const location = req.query?.location;

      const cameras = await watchStreamServices.getAllCamForLocation(req.user, location);

      res.status(200).json({
        IsSuccess: true,
        Data: cameras,
        Message: 'Camera details'
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },
  addRecentViewers: async (req, res, next) => {
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      const recentViewer = await watchStreamServices.addRecentViewers(params);

      res.status(200).json({
        IsSuccess: true,
        Data: recentViewer,
        Message: 'recent viewer added'
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  getAllCamForUser: async (req, res, next) => {
    try {
      const camDetails = await watchStreamServices.getAllCamForUser(req.user);

      res.status(200).json({
        IsSuccess: true,
        Data: camDetails,
        Message: 'recent viewer added'
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
