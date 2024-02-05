const cameraServices = require('../services/cameras');
const { startEncodingStream, deleteEncodingStream } = require('../lib/rtsp-stream');
const _ = require('lodash');
const customerServices = require('../services/customers');
const logServices = require('../services/logs');
const userServices = require('../services/users');
const socketServices = require('../services/socket');
const CONSTANTS = require('../lib/constants');
const sequelize = require('../lib/database');
module.exports = {
  // encode stream and create new camera
  createCamera: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      params = req.body;
      params.cust_id = req.user.cust_id || req.body.cust_id;

      const customer = await customerServices.getCustomerDetails(params.cust_id, t);
      // const availableCameras = customer?.available_cameras;
      const maxCameras = customer?.max_cameras;

      const cameras = await cameraServices.getAllCameraForCustomer(params.cust_id , req.user, {});
      const diff = maxCameras - cameras.count;
      if (diff > 0) {
        const token = req.userToken;
        const transcodedDetails = await startEncodingStream(
          params.cam_uri,
          token,
          params.cust_id
        );
        params.stream_uri = transcodedDetails?.data ? transcodedDetails.data?.uri : '';
        params.stream_uuid = transcodedDetails?.data ? transcodedDetails.data?.id : '';
        params.cam_alias = transcodedDetails?.data ? transcodedDetails.data?.alias : '';
        const camera = await cameraServices.createCamera(params, t);

        // const resetAvailableCameras = await customerServices.setAvailableCameras(
        //   params.cust_id,
        //   availableCameras - 1,
        //   t
        // );

        let usersdata = await userServices.getUsersSocketIds(params.cust_id);
            usersdata = usersdata.filter(user => user.socket_connection_id && user.dashboard_locations);
  
       if(!_.isEmpty(usersdata)){
        await Promise.all(
          usersdata.map(async (user) => {
            const enrolledStreams = await cameraServices.getAllCameraForCustomerDashboard(params.cust_id, user?.dashboard_locations, t);
            await socketServices.emitResponse(user?.socket_connection_id, {"enrolledStreams": enrolledStreams});
          })
        );
       }

        await t.commit();
        res.status(201).json({
          IsSuccess: true,
          Data: camera,
          Message: CONSTANTS.CAMERA_CREATED
        });
      } else {
        res.status(400).json({
          IsSuccess: false,
          Data: {},
          Message: CONSTANTS.MAX_CAMERA_ALLOWED
        });
      }

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
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
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const token = req.userToken;

      const customer = await customerServices.getCustomerDetails(req.user.cust_id, t);
      // const availableCameras = customer?.available_cameras;

      const camEncodedDeleted = await deleteEncodingStream(
        params.streamId,
        params.wait,
        token,
        req.user.cust_id,
        t
      );

      const cameraDeleted = await cameraServices.deleteCamera(params.cam_id, t);

      if (cameraDeleted === 0) {
        res.status(404).json({
          IsSuccess: false,
          Data: {},
          Message: CONSTANTS.CAMERA_NOT_FOUND
        });
      } else if (camEncodedDeleted.status === 200) {
        // const resetAvailableCameras = await customerServices.setAvailableCameras(
        //   req.user.cust_id,
        //   availableCameras + 1,
        //   t
        // );

        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.CAMERA_DELETED
        });
      } else {
        // const resetAvailableCameras = await customerServices.setAvailableCameras(
        //   req.user.cust_id,
        //   availableCameras + 1,
        //   t
        // );

        res.status(200).json({
          IsSuccess: false,
          Data: {},
          Message: CONSTANTS.STREAM_NOT_FOUND
        });
      }

      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
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
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const token = req.userToken;

      const cameraUpdated = await cameraServices.editCamera(
        {
          cam_id: params.camId,
          cam_name: params.camName
        },
        t
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: false,
        Data: {},
        Message: CONSTANTS.CAMERA_UPDATED
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
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
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'"),
        cust_id: req.query?.cust_id
      };
      const cameras = await cameraServices.getAllCameraForCustomer(req.user.cust_id , req.user, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: cameras,
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
    }
  }
};
