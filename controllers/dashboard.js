const cameraServices = require("../services/cameras");
const familyServices = require("../services/families");
const childrenServices = require("../services/children");
const dashboardServices = require("../services/dashboard");
const watchStreamServices = require("../services/watchStream");
const customerServices = require("../services/customers");
const liveStreamServices = require("../services/liveStream");
const { listAvailableStreams } = require("../lib/rtsp-stream");
const _ = require("lodash");
const sequelize = require("../lib/database");
const CONSTANTS = require("../lib/constants");
module.exports = {
  // get all stream statistics data to populate dashboard
  getStreamStatistics: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      params = req.body;
      custId = req.user.cust_id || req.query.cust_id;
      userId = req.user.user_id;
      let defaultWatchStream = req.user?.dashboard_cam_preference || {};
      if (req.user.role === "Super Admin") {
        let watchStream = await dashboardServices.getCamPreference(custId);
        defaultWatchStream = watchStream || {};
      }
      const token = req.userToken;
  
      let streams = await listAvailableStreams(token, custId);
      const totalStreams =
        await cameraServices.getAllCameraForCustomerDashboard(custId, t);
      let totalActiveStreams = streams?.data?.filter((stream) => {
        return stream.running === true;
      });

      let activeStreams = [];
      totalStreams?.forEach((stream) => {
        totalActiveStreams?.forEach((obj) => {
          if (obj.id === stream.stream_uuid) {
            activeStreams.push(stream);
          }
        });
      });

      let SEAMembers = await familyServices.getFamilyWithSEA(userId, t);
      const childSEA = await dashboardServices.getChildrenWithSEA(custId, req?.query?.location);
      let childrenWithEnableDate = [];
      let childrenWithDisableDate = [];

      childSEA.forEach((child) => {
        let roomsToEnable = [];
        let roomsToDisable = [];
        child.roomsInChild.forEach((room) => {
          if (room.scheduled_disable_date != null) {
           if(req.query?.location !== "All"){
            if(req.query?.location == room.room.location){
              roomsToDisable.push(room.room.room_name);
            }
           }
           else{
            roomsToDisable.push(room.room.room_name);
           }
           
          } else {
            if(req.query?.location !== "All"){
              if(req.query?.location == room.room.location){
                roomsToEnable.push(room.room.room_name);
              }
             }
             else{
            roomsToEnable.push(room.room.room_name);
             }
          }
        });

        if (roomsToDisable.length != 0) {
          childrenWithDisableDate.push({
            childFirstName: child.first_name,
            childLastName: child.last_name,
            rooms: roomsToDisable,
          });
        }
        if (roomsToEnable.length != 0) {
          childrenWithEnableDate.push({
            childFirstName: child.first_name,
            childLastName: child.last_name,
            rooms: roomsToEnable,
          });
        }
        if (roomsToEnable.length == 0 && roomsToDisable.length == 0) {
          if (child.scheduled_end_date != null) {
            childrenWithDisableDate.push({
              childFirstName: child.first_name,
              childLastName: child.last_name,
              rooms: roomsToDisable,
            });
          }
          if (child.scheduled_enable_date != null) {
            childrenWithEnableDate.push({
              childFirstName: child.first_name,
              childLastName: child.last_name,
              rooms: roomsToEnable,
            });
          }
        }
      });
      SEAMembers = SEAMembers?.length + childSEA?.length;

      const topViewers = await dashboardServices.topViewersOfTheWeek(
        req.user,
        req.query?.cust_id,
        req.query?.location
      );
      const recentViewers = await dashboardServices.getLastOneHourViewers(
        req.user,
        req.query?.cust_id,
        req.query?.location
      );
      
      let cameras = await watchStreamServices.getAllCamForLocation({
        ...req.user,
        cust_id: custId,
      });
      const customerDetails = await customerServices.getCustomerDetails(custId, t);
      cameras = _.uniqBy(cameras, "room_id");
      cameras?.forEach((cam, camIndex) => {
        cameras[camIndex].timeout = customerDetails.timeout;
        cameras[camIndex].permit_audio = customerDetails.permit_audio;
      });
      const activeLiveStreams = await liveStreamServices.getAllActiveStreams(custId, req?.query?.location, t);
      const childrens = await childrenServices.getAllChildren(t);
      const familyMembers = await familyServices.getAllFamilyMembers(t);
      const families = await familyServices.getAllFamilyIds(t);
      const recentLiveStreams = await liveStreamServices.getRecentStreams(custId, req?.query?.location, t);
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {
          enrolledStreams: totalStreams ? totalStreams.length : 0,
          activeStreams: activeStreams ? activeStreams.length : 0,
          activeLiveStreams: activeLiveStreams ? activeLiveStreams : [],
          recentLiveStreams: recentLiveStreams ? recentLiveStreams : [],
          childrens: childrens ? childrens.length : 0,
          familyMembers: familyMembers ? familyMembers.length : 0,
          families: families ? families.length : 0,
          SEAMembers: SEAMembers ? SEAMembers : 0,
          topViewers: topViewers ? topViewers : "",
          recentViewers: recentViewers?.length != 0 ? recentViewers.length : 0,
          childSEA: childSEA,
          childrenWithEnableDate,
          childrenWithDisableDate,
          enroledStreamsDetails: recentViewers ? recentViewers : 0,
          defaultWatchStream: defaultWatchStream ?? null,
          watchStreamDetails: cameras[0] ?? null,
        },
        Message: CONSTANTS.STREAM_DATA,
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

  setCamPreference: async (req, res, next) => {
    try {
      let cameras = req?.body?.data ? req?.body?.data : req?.body;

      const addPreferance = await dashboardServices.setCamPreference(
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
};
