const cameraServices = require('../services/cameras');
const { startEncodingStream, deleteEncodingStream, startEncodingStreamToFixCam, stopEncodingStream } = require('../lib/rtsp-stream');
const _ = require('lodash');
const customerServices = require('../services/customers');
const logServices = require('../services/logs');
const userServices = require('../services/users');
const socketServices = require('../services/socket');
const s3BucketImageUploader = require('../lib/aws-services');
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
        if (params?.thumbnail) {
          const imageUrl = await s3BucketImageUploader._upload(params.thumbnail);
          params.thumbnail = imageUrl
        }
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
      if (params?.thumbnail && !params?.thumbnail.includes('https://zoominlive-cam-thumbs.s3.amazonaws.com')) {
        const imageUrl = await s3BucketImageUploader._upload(params?.thumbnail);
        params.thumbnail = imageUrl;
      }
      // const getPresignedUrl = await s3BucketImageUploader.getPresignedUrlForThumbnail(params?.s3Uri);
      const cameraUpdated = await cameraServices.editCamera(
        params.cam_id,
        {
          cam_id: params.cam_id,
          cam_name: params.cam_name,
          thumbnail: params?.s3Uri ? params?.s3Uri : params?.thumbnail 
        },
        t
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: cameraUpdated,
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

  // fix camera
  fixCamera: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const token = req.userToken;
      const camEncodedStopped = await stopEncodingStream(
        params.streamId,
        params.wait,
        token,
        req.user.cust_id || params.cust_id,
        t
      );
      let camera;
      if (camEncodedStopped) {
        const token = req.userToken;
        const transcodedDetails = await startEncodingStreamToFixCam(
          params.cam_uri,
          token,
          req.user.cust_id || params.cust_id,
          params.streamId
        );
        // console.log('transcodedDetails-->', transcodedDetails);
        params.stream_uri = transcodedDetails?.data ? transcodedDetails.data?.uri : '';
        params.stream_uuid = transcodedDetails?.data ? transcodedDetails.data?.id : '';
        params.cam_alias = transcodedDetails?.data ? transcodedDetails.data?.alias : '';
        params.cust_id = req.user.cust_id ? req.user.cust_id : params.cust_id
        camera = await cameraServices.editCamera(params.cam_id, params, t);
      }
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: camera,
        Message: CONSTANTS.CAMERA_FIXED
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

  // generate thumbnail
  generateThumbnail: async (req, res) => {
    try {
      const filter = {
        sid: req.query?.sid,
        hlsStreamUri: req.query?.stream_uri,
        userId: req.user?.user_id
      };
      const token = req.userToken;
      const thumbailRes = await cameraServices.getThumbnailUrl(req.user?.cust_id, token, filter)
      res.status(200).json({
        IsSuccess: true,
        Data: thumbailRes,
        Message: 'Thumbnail details'
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        IsSuccess: false,
        error_log: error.response.data,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
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
      const generatePresignedUrlForThumbnail = async (thumbnail) => {
        // Check if the thumbnail contains an S3 URI
        if (thumbnail && thumbnail.startsWith('s3://')) {
            // Extract bucket name and object key from the S3 URI
        
            try {
                // Generate the presigned URL
                const presignedUrl = await s3BucketImageUploader.getPresignedUrlForThumbnail(thumbnail);
                return presignedUrl;
            } catch (error) {
                console.error('Error generating presigned URL:', error);
                return null;
            }
        } else {
            return null; // Return null if the thumbnail does not contain an S3 URI
        }
      };
      // Function to generate presigned URLs for thumbnails in the provided array
      const generatePresignedUrlsForThumbnails = async (cameras) => {
        const camerasWithPresignedUrls = await Promise.all(cameras.map(async (camera) => {
            // Generate presigned URL for thumbnail if it contains an S3 URI
            if (camera.thumbnail && camera.thumbnail.startsWith('s3://')) {
              camera.thumbnailPresignedUrl = await generatePresignedUrlForThumbnail(camera.thumbnail);
            }
            return camera;
        }));
        return { cameras: camerasWithPresignedUrls };
      };
      let mappedCamValues = cameras.cams.map((item) => item.dataValues)
      const camerasWithPresignedUrls = await generatePresignedUrlsForThumbnails(mappedCamValues);
      cameras.cams = camerasWithPresignedUrls.cameras
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
  },

  // get all camera's for transcoder
  getAllCamerasForTranscoder: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.substring(7);
      // test commit
      const decodeToken = jwt.verify(token, process.env.TRANSCODER_SECRET);
      const { rtsp_transcoder_endpoint } = decodeToken;
      let customers;
      if ( rtsp_transcoder_endpoint ) {
        customers = await Customers.findAll({ where: { transcoder_endpoint: rtsp_transcoder_endpoint } });
      }

      if (customers) {
        let cust_ids = customers.map((item) => item.cust_id)
        console.log('cust_ids-->', cust_ids);
        const cameras = await cameraServices.getAllCameraForTranscoder(cust_ids);
        const generatePresignedUrlForThumbnail = async (thumbnail) => {
          // Check if the thumbnail contains an S3 URI
          if (thumbnail && thumbnail.startsWith('s3://')) {
              // Extract bucket name and object key from the S3 URI
          
              try {
                  // Generate the presigned URL
                  const presignedUrl = await s3BucketImageUploader.getPresignedUrlForThumbnail(thumbnail);
                  return presignedUrl;
              } catch (error) {
                  console.error('Error generating presigned URL:', error);
                  return null;
              }
          } else {
              return null; // Return null if the thumbnail does not contain an S3 URI
          }
        };
        // Function to generate presigned URLs for thumbnails in the provided array
        const generatePresignedUrlsForThumbnails = async (cameras) => {
          const camerasWithPresignedUrls = await Promise.all(cameras.map(async (camera) => {
              // Generate presigned URL for thumbnail if it contains an S3 URI
              if (camera.thumbnail && camera.thumbnail.startsWith('s3://')) {
                camera.thumbnailPresignedUrl = await generatePresignedUrlForThumbnail(camera.thumbnail);
              }
              return camera;
          }));
          return { cameras: camerasWithPresignedUrls };
        };
        let mappedCamValues = cameras.cams.map((item) => item.dataValues)
        const camerasWithPresignedUrls = await generatePresignedUrlsForThumbnails(mappedCamValues);
        cameras.cams = camerasWithPresignedUrls.cameras
        res.status(200).json({
          IsSuccess: true,
          Data: cameras,
          Message: CONSTANTS.CAMERA_DETAILS
        });
  
        next();
      } else {
        return res.status(401).json({ error: 'No Customers found' });
      }
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
