const cameraServices = require('../services/cameras');
const { startEncodingStream, deleteEncodingStream } = require('../lib/rtsp-stream');
const _ = require('lodash');
module.exports = {
  createCamera: async (req, res, next) => {
    try {
      params = req.body;
      params.cust_id = req.user.cust_id;

      const details = await startEncodingStream(params.cam_uri);
      console.log(details);
      // params.stream_uri = encodedCamDetails.uri;
      // params.stream_uuid = encodedCamDetails.id;
      // params.cam_alias = _.isEmpty(encodedCamDetails.alias)
      //   ? encodedCamDetails.id
      //   : encodedCamDetails.alias;
      // const camera = await cameraServices.createCamera(params);

      res.status(201).json({
        IsSuccess: true,
        Data: {},
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

      const camEncodedDeleted = await deleteEncodingStream(params.streamId, params.wait);

      if (cameraDeleted === 0) {
        res.status(404).json({
          IsSuccess: false,
          Data: {},
          Message: 'Camera not found'
        });
      } else if (camEncodedDeleted.status === 200) {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: 'Camera Deleted'
        });
      } else {
        res.status(404).json({
          IsSuccess: false,
          Data: {},
          Message: 'encoded Camera is already deleted for given camera_url'
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
