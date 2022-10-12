const cameraServices = require('../services/cameras');
const { startEncodingStream, deleteEncodingStream } = require('../lib/rtsp-stream');
const _ = require('lodash');
var uuid = require('uuid');

module.exports = {
  createCamera: async (req, res, next) => {
    try {
      params = req.body;
      params.cust_id = req.user.cust_id;

      // const details = await startEncodingStream(params.cam_uri);

      params.stream_uri = uuid.v4();
      params.stream_uuid = uuid.v4();
      params.cam_alias = uuid.v4();
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
      const cameraDeleted = await cameraServices.deleteCamera(params.cam_id);

      // const camEncodedDeleted = await deleteEncodingStream(params.streamId, params.wait);

      if (cameraDeleted === 0) {
        res.status(404).json({
          IsSuccess: false,
          Data: {},
          Message: 'Camera not found'
        });
      }
      //  else if (camEncodedDeleted.status === 200) {
      //   res.status(200).json({
      //     IsSuccess: true,
      //     Data: {},
      //     Message: 'Camera Deleted'
      //   });
      // }
      else {
        res.status(200).json({
          IsSuccess: false,
          Data: {},
          Message: 'Camera deleted'
        });
      }

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
        Message: `All the cam's Details`
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
