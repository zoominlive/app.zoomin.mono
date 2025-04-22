const cameraServices = require('../services/cameras');
const { startEncodingStream, deleteEncodingStream, startEncodingStreamToFixCam, stopEncodingStream, stopEncodingStreamPrivacyMasking, startRecordingStream, stopRecordingStream } = require('../lib/rtsp-stream');
const _ = require('lodash');
const customerServices = require('../services/customers');
const logServices = require('../services/logs');
const userServices = require('../services/users');
const socketServices = require('../services/socket');
const s3BucketImageUploader = require('../lib/aws-services');
const CONSTANTS = require('../lib/constants');
const sequelize = require('../lib/database');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require("uuid");
const CustomerLocations = require('../models/customer_locations');
const Camera = require('../models/camera');
const zoneServices = require('../services/zones');
const RecordRtsp = require('../models/record_rtsp');
const { Sequelize } = require('sequelize');
const RecordTag = require('../models/record_tag');
const connectToDatabase = require("../models/index");

module.exports = {
  // encode stream and create new camera
  createCamera: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      params = req.body;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      let validZones = [];
      let validationMessages = [];
      const userLocations = req.user.locations.map((item) => item.loc_id);  
      // Location validation
      if (!userLocations.includes(params.location) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access. Please enter the location you have access to"})
      }
      // Validate all zones before proceeding
      for (const zone of params.zones) {
        const validation = await zoneServices.validateZone(zone.zone_id, params.cust_id);
        if (validation.valid) {
          validZones.push(zone);
        } else {
          validationMessages.push(validation.message);
        }
      }

       // Check if there's at least one valid camera
      // if (validZones.length === 0) {
      //   await t.rollback();
      //   return res.status(400).json({
      //     IsSuccess: false,
      //     Message: "No valid zones found. " + validationMessages.join(" "),
      //   });
      // }
      // Check if a camera with the same cam_uri already exists
      const existingCamera = await cameraServices.findCameraByUri(
        params.cam_uri
      );
      if (existingCamera) {
        await t.rollback();
        return res.status(400).json({
          IsSuccess: false,
          Message: "Add Camera failed. A camera with the same cam_uri already exists.",
        });
      }
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
          params.location,
          params.cust_id,
          params.max_resolution, 
          params.max_fps, 
          params.max_file_size
        );
        console.log('transcoderDetails==>', transcodedDetails);
        params.cam_id = uuidv4();
        params.stream_uri = transcodedDetails?.data ? transcodedDetails.data?.uri : '';
        params.stream_uuid = transcodedDetails?.data ? transcodedDetails.data?.id : '';
        params.cam_alias = transcodedDetails?.data ? transcodedDetails.data?.alias : '';
        params.stats = transcodedDetails?.data ? transcodedDetails.data?.stats : '';
        params.loc_id = params.location;
        if (params?.thumbnail) {
          const imageUrl = await s3BucketImageUploader._upload(params.thumbnail);
          params.thumbnail = imageUrl
        }
        if (transcodedDetails.status == 200) {
          const camera = await cameraServices.createCamera(params, params.zones, t);
  
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
        } else if (transcodedDetails.response.data.error) {
          await t.rollback();
          return res.status(400).json({
            IsSuccess: false,
            Data: {},
            Message: 'Add camera failed!' +' '+ transcodedDetails.response.data.error
          });
        }
      } else {
        await t.rollback();
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

  startCameraRecording: async (req, res, next) => {
    try {
      params = req.body;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      params.user_id = req.body.user_id;
      params.cam_id = req.body.cam_id;
      
      const token = req.userToken;
      
      const transcodedDetails = await startRecordingStream(
        token,
        params.alias,
        params.location,
        params.cust_id,
        params.user_id,
        params.permit_audio,
        params.max_record_time,
      );
      
      if (transcodedDetails?.response?.data.error) {
        res.status(409).json({
          IsSuccess: false,
          Message: transcodedDetails.response.data.error
        });
      } else {
        console.log('transcodedDetails==>', transcodedDetails);
        const convertS3ToCloudFront = (s3Url, cloudFrontDomain) => {
          return s3Url.replace(/https?:\/\/[^/]+/, cloudFrontDomain);
        };
        
        // Example Usage
        const s3Url = transcodedDetails.data.video_url;
        const cloudFrontDomain = "https://d21wx6fkc3aal5.cloudfront.net";
        
        const cloudFrontUrl = convertS3ToCloudFront(s3Url, cloudFrontDomain);
        console.log("cloudFrontUrl==>", cloudFrontUrl);
        
        const { RecordRtsp } = await connectToDatabase();
        if(transcodedDetails) {
          let recordRtspObj = {};
          recordRtspObj.record_uuid = transcodedDetails.data.recording_id;
          recordRtspObj.start_time = transcodedDetails.data.start_time;
          recordRtspObj.active = true;
          recordRtspObj.user_id = params.user_id;
          recordRtspObj.cam_id = params.cam_id;
          recordRtspObj.zone_id = params.zone_id;
          recordRtspObj.zone_name = params.zone_name;
          recordRtspObj.thumbnail_url = transcodedDetails.data.thumbnail_url;
          recordRtspObj.video_url = transcodedDetails.data.video_url;
          // recordRtspObj.video_url = cloudFrontUrl;
          console.log('recordRtspObj==>', recordRtspObj);
          
          const recordRtspCreated = await RecordRtsp.create(recordRtspObj);
          console.log('recordRtspCreated==>', recordRtspCreated);
        }
        res.status(201).json({
          IsSuccess: true,
          Data: transcodedDetails.data,
          Message: "Recording Started"
        });
      }

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

  stopCameraRecording: async (req, res, next) => {
    try {
      params = req.body;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      params.user_id = req.body.user_id || req.user.user_id;
      params.cam_id = req.body.cam_id;

      let recordRtspData = await RecordRtsp.findOne({
        where: {
          [Sequelize.Op.and]: [
            { user_id: params.user_id },
            { cam_id: params.cam_id },
            { active: true },
          ],
        },
        order:[["created_at", "DESC"]],
        raw: true
      });
      console.log('recordRtspData==>', recordRtspData);
      
      const token = req.userToken;
      const transcodedDetails = await stopRecordingStream(
        token,
        params.location,
        recordRtspData.record_uuid,
        params.cust_id
      );
      
      if (transcodedDetails?.response?.data.error) {
        res.status(409).json({
          IsSuccess: false,
          Message: transcodedDetails.response.data.error
        });
      } else {
        console.log('transcodedDetails==>', transcodedDetails);
        
        const updateRecordRtsp = await RecordRtsp.update(
          {
            stop_time: transcodedDetails.data.data.end_time,
            duration: transcodedDetails.data.data.recording_duration,
            tag_id: params.tag_id,
            active: false,
          },
          { where: { record_uuid: recordRtspData.record_uuid } }
        );
        console.log('updateRecordRtsp==>', updateRecordRtsp);
        
        res.status(201).json({
          IsSuccess: true,
          Data: transcodedDetails.data.message
        });
      }

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

  editCameraRecording: async (req, res, next) => {
    try {
      params = req.body;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      params.user_id = req.body.user_id || req.user.user_id;
      params.cam_id = req.body.cam_id;

      let recordRtspData = await RecordRtsp.findOne({
        where: {
          [Sequelize.Op.and]: [
            { user_id: params.user_id },
            { cam_id: params.cam_id },
            { active: true },
          ],
        },
        order:[["created_at", "DESC"]],
        raw: true
      });
      
      const updateRecordRtsp = await RecordRtsp.update(
        {
          tag_id: params.tag_id,
        },
        { where: { record_uuid: recordRtspData.record_uuid } }
      );
      console.log('updateRecordRtsp==>', updateRecordRtsp);
      
      res.status(201).json({
        IsSuccess: true,
        Data: 'Recording Tag Updated'
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

  addRecordTag: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      params.tag_id = uuidv4();
      const recordTagCreated = await RecordTag.create(params, t);

      await t.commit();
      res.status(201).json({
        IsSuccess: true,
        Data: recordTagCreated,
        Message: "Record Tag created successfully."
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
        function: 'Record_Tag',
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
  
  editRecordTag: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      const recordTagCreated = await RecordTag.update(params, {where: {tag_id: params.tag_id}}, t);

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: recordTagCreated,
        Message: "Record Tag updated successfully."
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
        function: 'Record_Tag',
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
  
  deleteRecordTag: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      
      const tagIsAssigned = await RecordRtsp.findAll({ where: { tag_id: params.tag_id } });
      
      if (tagIsAssigned.length > 0) {
        await t.rollback();
        res.status(400).json({
          IsSuccess: false,
          Message: "Tag is already assigned and cannot be deleted.",
        });
        return;
      }

      const recordTagCreated = await RecordTag.destroy({where: {tag_id: params.tag_id}}, t);

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: recordTagCreated,
        Message: "Record Tag deleted successfully."
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
        function: 'Record_Tag',
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
  
  listRecordTags: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'"),
        pageCount: req.query?.pageCount,
        orderBy: req.query?.orderBy,
        all: req.query?.all,
        cust_id: req.query?.cust_id,
      };

      if (filter.cust_id !== "" && filter.cust_id !== undefined) {
        if (
          req.user.role !== "Super Admin" &&
          req.user.cust_id !== filter.cust_id
        ) {
          return res.status(400).json({ Message: "Unauthorized request" });
        }
      }

      let {
        pageNumber = 0,
        pageSize = 10,
        searchBy = "",
        all = false,
        cust_id = null,
      } = filter;

      let recordTags;

      if (all) {
        recordTags = await RecordTag.findAndCountAll({
          where: {
            cust_id: req.user.cust_id || cust_id,
            [Sequelize.Op.or]: [
              {
                zone_type: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
            ],
          },
          attributes: ["tag_id", "tag_name", "status"],
        });
      } else {
        recordTags = await RecordTag.findAndCountAll({
          where: {
            cust_id: req.user.cust_id || cust_id,
            [Sequelize.Op.or]: [
              {
                tag_name: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
            ],
          },
          attributes: ["tag_id", "tag_name", "status"],
          limit: parseInt(pageSize),
          offset: parseInt(pageNumber * pageSize),
        });
      }

      res.status(200).json({
        IsSuccess: true,
        Data: { recordTags: recordTags.rows, count: recordTags.count },
        Message: "All Record Tags details.",
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR,
      });
      next(error);
    }
  },

  // delete encoded stream and camera
  deleteCamera: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.custId = req.user.cust_id || req.body.cust_id;
      const token = req.userToken;

      const customer = await customerServices.getCustomerDetails(req.user.cust_id, t);
      const userLocations = req.user.locations.map((item) => item.loc_id)
      const validateLocation = await customerServices.validateLocation(params.location, userLocations);
      if (!validateLocation.valid && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: validateLocation.message});
      }
      const validation = await cameraServices.validateCamera(params.cam_id, params.custId);
      if (!validation.valid && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: validation.message});
      }
      // const availableCameras = customer?.available_cameras;
      if(!params.streamId) {
        console.log('inside==>');
        const camera = await Camera.findOne({where: {cam_id: params.cam_id}, raw: true, plain: true});
        params.streamId = camera.streamId;
      }
      const camEncodedDeleted = await deleteEncodingStream(
        params.streamId,
        params.alias,
        params.wait,
        token,
        req.user.cust_id,
        params.location,
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
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.CAMERA_DELETED
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
      params.custId = req.user.cust_id || req.body.cust_id;
      if (params?.thumbnail && !params?.thumbnail.includes('https://zoominlive-cam-thumbs.s3.amazonaws.com')) {
        const imageUrl = await s3BucketImageUploader._upload(params?.thumbnail);
        params.thumbnail = imageUrl;
      }
      // const getPresignedUrl = await s3BucketImageUploader.getPresignedUrlForThumbnail(params?.s3Uri);
      const validation = await cameraServices.validateCamera(params.cam_id, params.custId);
      if (!validation.valid && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: validation.message});
      }

      const cameraUpdated = await cameraServices.editCamera(
        params.cam_id,
        {
          ...params,
          cam_id: params.cam_id,
          cam_name: params.cam_name,
          thumbnail: params?.s3Uri ? params?.s3Uri : params?.thumbnail 
        },
        params.zones,
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
      console.log('req.user==', req.user);
      console.log('params==', params);
      if (!params.streamId && !params.alias) {
        return res.status(400).json({
          IsSuccess: false,
          Message: "Missing Stream ID or Alias"
        });
      }
      const camEncodedStopped = await stopEncodingStream(
        params.streamId,
        params.alias,
        params.wait,
        token,
        req.user.cust_id || params.cust_id,
        params.location,
      );
      let camera;
      if (camEncodedStopped) {
        const token = req.userToken;
        if (!params.streamId) params.streamId = uuidv4();
        const transcodedDetails = await startEncodingStreamToFixCam(
          params.cam_uri,
          token,
          params.location,
          req.user.cust_id || params.cust_id,
          params.streamId,
          params.max_resolution, 
          params.max_fps, 
          params.max_file_size
        );
        // console.log('transcodedDetails-->', transcodedDetails);
        if (transcodedDetails.status == 200) { 
          params.stream_uri = transcodedDetails?.data ? transcodedDetails.data?.uri : '';
          params.stream_uuid = transcodedDetails?.data ? transcodedDetails.data?.id : '';
          params.cam_alias = transcodedDetails?.data ? transcodedDetails.data?.alias : '';
          params.stats = transcodedDetails?.data ? transcodedDetails.data?.stats : '';
          params.cust_id = req.user.cust_id ? req.user.cust_id : params.cust_id
          camera = await cameraServices.editCamera(params.cam_id, params, null, t);
        } else if (transcodedDetails.response.data.error) {
          return res.status(400).json({
            IsSuccess: false,
            Data: {},
            Message: 'Add camera failed!' +' '+ transcodedDetails.response.data.error
          });
        }
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
      let filter = {
        sid: req.query?.sid,
        hlsStreamUri: req.query?.stream_uri,
        userId: req.user?.user_id
      };
      const token = req.userToken;
      filter.transcoder_endpoint = await customerServices.getTranscoderUrl(req.query.custId);
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
      if(req.user.role !== 'Super Admin' && filter.cust_id !== "" && filter.cust_id !== undefined) { 
        if (req.user.cust_id !== filter.cust_id) {
          return res.status(400).json({Message:"Unauthorized request"});
        }
      }
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
            let uid = req.user?.family_member_id || req.user?.user_id;
            let sid = camera?.cam_id;
            let uuid = uuidv4();
            const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
            // Generate presigned URL for thumbnail if it contains an S3 URI
            if (camera.thumbnail && camera.thumbnail.startsWith('s3://')) {
              camera.thumbnailPresignedUrl = await generatePresignedUrlForThumbnail(camera.thumbnail);
            }
            camera.stream_uri_seckey = `${camera?.stream_uri}?seckey=${token}`
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
      console.log('process.env.TRANSCODER_SECRET', process.env.TRANSCODER_SECRET);
      const decodeToken = jwt.verify(token, process.env.TRANSCODER_SECRET);
      const { rtsp_transcoder_endpoint } = decodeToken;
      console.log('rtsp_transcoder_endpoint==>', rtsp_transcoder_endpoint);
      
      let customerLocations;
      if ( rtsp_transcoder_endpoint ) {
        customerLocations = await CustomerLocations.findAll({ where: { transcoder_endpoint: rtsp_transcoder_endpoint } });
      }
      console.log('customerLocations==>', customerLocations.length);
      console.log('customerLocations==>', customerLocations.map((item) => item?.dataValues?.loc_id));
      if (customerLocations) {
        let cust_ids = customerLocations.map((item) => item.cust_id);
        let loc_ids = customerLocations.map((item) => item?.dataValues?.loc_id);
        console.log('cust_ids-->', cust_ids);
        const cameras = await cameraServices.getAllCameraForTranscoder(cust_ids, loc_ids);
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
