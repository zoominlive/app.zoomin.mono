const watchStreamServices = require("../services/watchStream");
const customerServices = require("../services/customers");
const _ = require("lodash");
const CONSTANTS = require("../lib/constants");
const logServices = require("../services/logs");
const dashboardServices = require("../services/dashboard");
const userServices = require("../services/users");
const familyServices = require("../services/families");
const cameraServices = require('../services/cameras');
const socketServices = require('../services/socket');
const sequelize = require("../lib/database");
const MountedCameraRecentViewers = require("../models/mounted_camera_recent_viewers");
const s3BucketImageUploader = require('../lib/aws-services');

module.exports = {
  // encode stream and create new camera
  getAllCamForLocation: async (req, res, next) => {
    let response;
    try {
      if (req.user.role == "Family") {
        let accessableLocsToFamily;
        if (req.user.cust_id) {
          accessableLocsToFamily =
            req.user?.location?.accessable_locations?.filter((loc) => {
              if (
                !req.user?.disabled_locations?.locations?.find(
                  (loc1) => loc1 == loc
                )
              ) {
                return loc;
              }
            });
        } else {
          let availableLocations = await customerServices.getLocationDetails(
            req.query?.cust_id
          );
          let locs = availableLocations.flatMap((i) => i.loc_name);
          accessableLocsToFamily = locs?.filter((loc) => {
            if (
              !req.user?.disabled_locations?.locations?.find(
                (loc1) => loc1 == loc
              )
            ) {
              return loc;
            }
          });
        }
        req.user.location.accessable_locations = accessableLocsToFamily;
      }
      let cameras = await watchStreamServices.getAllCamForLocation({
        ...req.user,
        cust_id: req.user.cust_id || req.query?.cust_id,
      });

      const customerDetails = await customerServices.getCustomerDetails(
        req.user.cust_id || req.query?.cust_id
      );
      cameras = _.uniqBy(cameras, "room_id");

      cameras?.forEach((cam, camIndex) => {
        cameras[camIndex].timeout = customerDetails.timeout;
        cameras[camIndex].permit_audio = customerDetails.permit_audio;
      });
      let defaultCams = req.user.cam_preference;
      if (req.user.role === "Super Admin") {
        let watchStream = await watchStreamServices.getCamPreference(
          req.query?.cust_id
        );
        defaultCams = watchStream || {};
      }

      response = { streamDetails: cameras, defaultCams: defaultCams };
      res.status(200).json({
        IsSuccess: true,
        Data: { streamDetails: cameras, defaultCams: defaultCams },
        Message: CONSTANTS.CAMERA_DETAILS,
      });

      next();
    } catch (error) {
      console.log(error);
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR,
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.family_member_id
          ? req?.user?.family_member_id
          : req?.user?.user_id
          ? req?.user?.user_id
          : "Not Found",
        function: "Watch_Stream",
        function_type: "Get",
        response: response,
      };
      try {
        await logServices.addAccessLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  addRecentViewers: async (req, res, next) => {
    try {
      const params = req.body;
      params.user = req.user;
      const recentViewer = await watchStreamServices.addRecentViewers(params);
      //await dashboardServices.updateDashboardData(params.user.cust_id);
      res.status(200).json({
        IsSuccess: true,
        Data: recentViewer,
        Message: CONSTANTS.RECENT_VIEWER_ADDED,
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

  getAllCamForUser: async (req, res, next) => {
    let response;
    try {
      if (req.user.role == "Family") {
        let accessableLocsToFamily =
          req.user?.location?.accessable_locations?.filter((loc) => {
            if (
              !req.user?.disabled_locations?.locations?.find(
                (loc1) => loc1 == loc
              )
            ) {
              return loc;
            }
          });
        req.user.location.accessable_locations = accessableLocsToFamily;
      }
      const camDetails = await watchStreamServices.getAllCamForUser({
        ...req.user,
        cust_id: req.user.cust_id || req.query?.cust_id,
      });
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
      const generatePresignedUrlsForThumbnails = async (locations) => {
        const locationsWithPresignedUrls = await Promise.all(locations.map(async (location) => {
            const roomsWithPresignedUrls = await Promise.all(location.rooms.map(async (room) => {
                const camerasWithPresignedUrls = await Promise.all(room.cameras.map(async (camera) => {
                    // Generate presigned URL for thumbnail if it contains an S3 URI
                    if (camera.thumbnail && camera.thumbnail.startsWith('s3://')) {
                        camera.thumbnailPresignedUrl = await generatePresignedUrlForThumbnail(camera.thumbnail);
                    } else {
                      camera.thumbnail = '',
                      camera.thumbnailPresignedUrl = ''
                    }
                    return camera;
                }));
                return { ...room, cameras: camerasWithPresignedUrls };
            }));
            return { ...location, rooms: roomsWithPresignedUrls };
        }));
        return locationsWithPresignedUrls;
      };
      const locationsWithPresignedUrls = await generatePresignedUrlsForThumbnails(camDetails);

      const customerDetails = await customerServices.getCustomerDetails(
        req.user.cust_id || req.query?.cust_id
      );

      locationsWithPresignedUrls?.forEach((room, roomIndex) => {
        locationsWithPresignedUrls[roomIndex].timeout = customerDetails.timeout;
        locationsWithPresignedUrls[roomIndex].permit_audio = customerDetails.permit_audio;
        room?.cameras?.forEach((cam, camIndex) => {
          locationsWithPresignedUrls[roomIndex].cameras[camIndex].permit_audio =
            customerDetails.permit_audio;
        });
      });
      response = locationsWithPresignedUrls;
      res.status(200).json({
        IsSuccess: true,
        Data: locationsWithPresignedUrls,
        Message: CONSTANTS.CAMERA_DETAILS,
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR,
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.family_member_id
          ? req?.user?.family_member_id
          : req?.user?.user_id
          ? req?.user?.user_id
          : "Not Found",
        function: "Watch_Stream",
        function_type: "Get",
        response: response,
      };
      try {
        await logServices.addAccessLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  setUserCamPreference: async (req, res, next) => {
    try {
      let cameras = req?.body?.data ? req?.body?.data : req?.body;

      const addPreferance = await watchStreamServices.setUserCamPreference(
        req.user,
        cameras
      );

      res.status(200).json({
        IsSuccess: true,
        Data: addPreferance,
        Message: CONSTANTS.CAM_PREFERENCE_STORED,
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

  ReportViewers: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      // Check if a record with the same viewer ID and function already exists
      const existingRecord = await MountedCameraRecentViewers.findOne({
        where: {
          viewer_id: params.viewer_id, 
          function: params.function // Assuming function is the field representing the function (start or stop)
        }
      });
      if (existingRecord) {
        throw new Error('A record already exists for the given stream ID and function.');
      }
      const recentViewer = await watchStreamServices.reportViewers(params);
      let user_family_obj = await userServices.getUserById(
        params?.recent_user_id
      );
      if (!user_family_obj) {
        user_family_obj = await familyServices.getFailyMemberById(
          params?.recent_user_id
        );
      }
      if (user_family_obj?.cust_id) {
        //await dashboardServices.updateDashboardData(user_family_obj?.cust_id);
        let usersdata = await userServices.getUsersSocketIds(user_family_obj?.cust_id);
            usersdata = usersdata.filter(user => user.socket_connection_id && user.dashboard_locations);
        
       if(!_.isEmpty(usersdata)){
        await Promise.all(
          usersdata.map(async (user) => {
            const totalStreams = await cameraServices.getAllCameraForCustomerDashboard(user_family_obj?.cust_id, user.dashboard_locations, t); 
            const numberofMountedCameraViewers =  totalStreams?.length > 0 ? await cameraServices.getAllMountedCameraViewers(totalStreams.flatMap(i => i.cam_id), t) : 0;
            await socketServices.emitResponse(user?.socket_connection_id, {"numberofMountedCameraViewers": numberofMountedCameraViewers});
          })
        );
       }

      }
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: recentViewer,
        Message: CONSTANTS.RECENT_VIEWER_ADDED,
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR,
      });
      next(error);
    }
  },
};
