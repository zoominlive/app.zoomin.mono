const cameraServices = require('../services/cameras');
const { startEncodingStream, deleteEncodingStream } = require('../lib/rtsp-stream');
const _ = require('lodash');
const customerServices = require('../services/customers');
const logServices = require('../services/logs');
const CONSTANTS = require('../lib/constants');

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
          Message: CONSTANTS.CAMERA_CREATED
        });
      } else {
        res.status(400).json({
          IsSuccess: false,
          Data: {},
          Message: `Maximum ${customer.max_cameras}` + CONSTANTS.MAX_CAMERA_ALLOWED
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Camera',
        function_type: 'Add',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
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
          Message: CONSTANTS.CAMERA_NOT_FOUND
        });
      } else if (camEncodedDeleted.status === 200) {
        const resetAvailableCameras = await customerServices.setAvailableCameras(
          req.user.cust_id,
          availableCameras + 1
        );

        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.CAMERA_DELETED
        });
      } else {
        const resetAvailableCameras = await customerServices.setAvailableCameras(
          req.user.cust_id,
          availableCameras + 1
        );

        res.status(200).json({
          IsSuccess: false,
          Data: {},
          Message: CONSTANTS.STREAM_NOT_FOUND
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Camera',
        function_type: 'Delete',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
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
        Message: CONSTANTS.CAMERA_UPDATED
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
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Camera',
        function_type: 'Edit',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  // get all camera's
  getAllCameras: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        location: req.query?.location,
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'")
      };
      const cameras = await cameraServices.getAllCameraForCustomer(req.user.cust_id, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: cameras,
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
