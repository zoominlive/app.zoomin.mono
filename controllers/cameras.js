const cameraServices = require('../services/cameras');
const { startEncodingStream, deleteEncodingStream } = require('../lib/rtsp-stream');
const _ = require('lodash');
const customerServices = require('../services/customers');

module.exports = {
  // encode stream and create new camera
  createCamera: async (req, res, next) => {
    try {
      params = req.body;
      params.cust_id = req.user.cust_id;

      const customer = await customerServices.getCustomerDetails(params.cust_id);
      const availableCameras = customer?.available_cameras;

      if (availableCameras > 0) {
        const token = req.userToken;
        const transcodedDetails = await startEncodingStream(
          params.cam_uri,
          token,
          req.user.cust_id
        );
        params.stream_uri = transcodedDetails?.data ? transcodedDetails.data?.uri : '';
        params.stream_uuid = transcodedDetails?.data ? transcodedDetails.data?.id : '';
        params.cam_alias = transcodedDetails?.data ? transcodedDetails.data?.alias : '';
        const camera = await cameraServices.createCamera(params);

        const resetAvailableCameras = await customerServices.setAvailableCameras(
          req.user.cust_id,
          availableCameras - 1
        );

        res.status(201).json({
          IsSuccess: true,
          Data: camera,
          Message: 'Camera created'
        });
      } else {
        res.status(400).json({
          IsSuccess: false,
          Data: {},
          Message: `Maximum ${customer.max_cameras} cameras are allowed`
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

  // delete encoded stream and camera
  deleteCamera: async (req, res, next) => {
    try {
      const params = req.body;
      const token = req.userToken;

      const customer = await customerServices.getCustomerDetails(req.user.cust_id);
      const availableCameras = customer?.available_cameras;

      const camEncodedDeleted = await deleteEncodingStream(
        params.streamId,
        params.wait,
        token,
        req.user.cust_id
      );

      const cameraDeleted = await cameraServices.deleteCamera(params.cam_id);

      if (cameraDeleted === 0) {
        res.status(404).json({
          IsSuccess: false,
          Data: {},
          Message: 'Camera not found'
        });
      } else if (camEncodedDeleted.status === 200) {
        const resetAvailableCameras = await customerServices.setAvailableCameras(
          req.user.cust_id,
          availableCameras + 1
        );

        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: 'Camera Deleted'
        });
      } else {
        const resetAvailableCameras = await customerServices.setAvailableCameras(
          req.user.cust_id,
          availableCameras + 1
        );

        res.status(200).json({
          IsSuccess: false,
          Data: {},
          Message: 'Stream not found , Camera deleted'
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

  // edit camera details
  editCamera: async (req, res, next) => {
    try {
      const params = req.body;
      const token = req.userToken;

      const cameraUpdated = await cameraServices.editCamera({
        cam_id: params.camId,
        cam_name: params.camName
      });

      res.status(200).json({
        IsSuccess: false,
        Data: {},
        Message: 'camera details updated'
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

  // get all camera's
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
