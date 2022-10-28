const watchStreamServices = require('../services/watchStream');
const _ = require('lodash');

module.exports = {
  // encode stream and create new camera
  getAllCamForLocation: async (req, res, next) => {
    try {
      const location = req.query?.location;
      const userId = req.user.user_id;
      const cameras = await watchStreamServices.getAllCamForLocation(userId, location);

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
  }
};
