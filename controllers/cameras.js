const cameraServices = require('../services/cameras');
const { startEncodingStream } = require('../lib/rtsp-stream');
const _ = require('lodash');
module.exports = {
  createCamera: async (req, res, next) => {
    try {
      params = req.body;
      params.cust_id = req.user.cust_id;

      const { data: encodedCamDetails } = await startEncodingStream(params.cam_uri);
      console.log('stream details', encodedCamDetails);
      params.stream_uri = encodedCamDetails.uri;
      params.stream_uuid = encodedCamDetails.id;
      params.cam_alias = _.isEmpty(encodedCamDetails.alias)
        ? encodedCamDetails.id
        : encodedCamDetails.alias;
      const camera = await cameraServices.createCamera(params);

      res.status(201).json({
        IsSuccess: true,
        Data: camera,
        Message: 'Camera created'
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

  deleteCamera: async (req, res, next) => {
    try {
      const params = req.body;
      const room = await roomServices.deleteRoom(params.room_id);

      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: 'Room Deleted'
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

  getAllCameras: async (req, res, next) => {
    try {
      const rooms = await roomServices.getAllRoomsDetails(req.user.user_id);

      res.status(200).json({
        IsSuccess: true,
        Data: rooms,
        Message: `All the room's details for user:${req.user.first_name}`
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
