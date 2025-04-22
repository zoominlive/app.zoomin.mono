const cameraServices = require("../services/cameras");
const familyServices = require("../services/families");
const childrenServices = require("../services/children");
const dashboardServices = require("../services/dashboard");
const watchStreamServices = require("../services/watchStream");
const customerServices = require("../services/customers");
const liveStreamServices = require("../services/liveStream");
const userServices = require("../services/users");
const s3BucketImageUploader = require("../lib/aws-services");
const { listAvailableStreams } = require("../lib/rtsp-stream");
const _ = require("lodash");
const sequelize = require("../lib/database");
const CONSTANTS = require("../lib/constants");
const { cons } = require("lodash-contrib");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
module.exports = {
  // get all stream statistics data to populate dashboard
  getStreamStatistics: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      params = req.body;
      custId = req.user.cust_id || req.query.cust_id;
      userId = req.user.user_id;
      let defaultWatchStream = req.user?.dashboard_cam_preference || {};
      if (defaultWatchStream && defaultWatchStream?.cameras?.stream_uri) {
        let uid = userId;
        let sid = defaultWatchStream?.cameras?.cam_id;
        let uuid = uuidv4();
        let stream_uri = new URL(defaultWatchStream?.cameras?.stream_uri).pathname;
        const token = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
        const baseUrl = await customerServices.getTranscoderUrlFromCustLocations(req.user?.locations?.map((item) => item.loc_id), custId);
        console.log('baseUrl==>', baseUrl);
        
        defaultWatchStream.cameras.stream_uri = `${baseUrl}${stream_uri}?seckey=${token}`;
      }
      if (req.user.role === "Super Admin") {
        let watchStream = await dashboardServices.getCamPreference(custId);
        defaultWatchStream = watchStream || {};
      }
      if(req.user.role !== "Super Admin"){
        let updateObj = { user_id: userId, dashboard_locations: req?.query?.location };
        await userServices.editUserProfile( updateObj, _.omit(updateObj, ["user_id"]), t);
      }
      const token = req.userToken;
      
      let streams = await listAvailableStreams(token, req?.query?.location);
      const totalStreams =
      await cameraServices.getAllCameraForCustomerDashboard(custId, req?.query?.location, t);
      //const numberofMountedCameraViewers =  await cameraServices.getAllMountedCameraViewers(custId, req?.query?.location, t);
      const numberofMountedCameraViewers =  totalStreams?.length > 0 ? await cameraServices.getAllMountedCameraViewers(totalStreams.flatMap(i => i.cam_id), t) : 0;
      let totalActiveStreams = streams?.data?.filter((stream) => {
        return stream.running === true;
      });
      console.log("==reached-dashboard==");
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
      // let  childrenWithEnableDate1= await familyServices.getSEAChilds(custId, req?.query?.location, true, t);
      // let  childrenWithDisableDate1= await familyServices.getSEAChilds(custId, req?.query?.location, false, t);

      let childrenWithEnableDate = [];
      let childrenWithDisableDate = [];

      childSEA.forEach((child) => {
        let zonesToEnable = [];
        let zonesToDisable = [];
        child.zonesInChild.forEach((zone) => {
          if (zone.scheduled_disable_date != null) {
           if(req.query?.location !== "All"){
            if(req.query?.location == zone.zone?.loc_id || req.query?.location?.length !== 0){
              zonesToDisable.push(zone.zone?.zone_name);
            }
           }
           else{
            zonesToDisable.push(zone.zone?.zone_name);
           }
           
          } else {
            if(req.query?.location !== "All"){
              if(req.query?.location == zone.zone?.loc_id || req.query?.location?.length !== 0){
                zonesToEnable.push(zone.zone?.zone_name);
              }
             }
             else{
              zonesToEnable.push(zone.zone?.zone_name);
             }
          }
        });

        if (zonesToDisable.length != 0) {
          childrenWithDisableDate.push({
            childFirstName: child.first_name,
            childLastName: child.last_name,
            zones: zonesToDisable,
            family: child.family,
            date: child.zonesInChild.map((item) => item.scheduled_disable_date),
            status: child.status
          });
        }
        if (zonesToEnable.length != 0 && child.zonesInChild.some((item) => item.scheduled_enable_date !== null)) {
          childrenWithEnableDate.push({
            childFirstName: child.first_name,
            childLastName: child.last_name,
            zones: zonesToEnable,
            family: child.family,
            date: child.zonesInChild.map((item) => item.scheduled_enable_date),
            status: child.status
          });
        }
        if (zonesToEnable.length == 0 && zonesToDisable.length == 0) {
          if (child.scheduled_end_date != null) {
            childrenWithDisableDate.push({
              childFirstName: child.first_name,
              childLastName: child.last_name,
              zones: zonesToDisable,
              family: child.family,
              date: child.zonesInChild.map((item) => item.scheduled_disable_date),
              status: child.status
            });
          }
          if (child.scheduled_enable_date != null) {
            childrenWithEnableDate.push({
              childFirstName: child.first_name,
              childLastName: child.last_name,
              zones: zonesToEnable,
              family: child.family,
              date: child.zonesInChild.map((item) => item.scheduled_enable_date),
              status: child.status
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
      cameras = _.uniqBy(cameras, "zone_id");
      cameras?.forEach((cam, camIndex) => {
        cameras[camIndex].timeout = customerDetails.timeout;
        cameras[camIndex].permit_audio = customerDetails.permit_audio;
      });
      const activeLiveStreams = await liveStreamServices.getAllActiveStreams(custId, req?.query?.location, t);
      const numberofActiveStreamViewers = activeLiveStreams.length > 0 ? await liveStreamServices.getAllActiveStreamViewers(activeLiveStreams.flatMap(i => i.stream_id), t) : 0;
      //const numberofActiveStreamViewers = await liveStreamServices.getAllActiveStreamViewers();
      const childrens = await childrenServices.getAllChildren(custId, req?.query?.location,t);
      // const familyMembers = await familyServices.getAllFamilyMembers(custId, req?.query?.location, t);
      const families = await familyServices.getAllFamilyIds(custId, req?.query?.location,t);
      const users = await userServices.getAllUserIds(custId, req?.query?.location,t);
      let recentLiveStreams = await liveStreamServices.getRecentStreams(custId, req?.query?.location, t);
      if(recentLiveStreams.length > 0){

        recentLiveStreams = await Promise.all(recentLiveStreams.map(async item => {
          const presigned_url = item?.dataValues?.s3_url ? await s3BucketImageUploader.getPresignedUrl(item?.dataValues?.s3_url) : ""
          let newDataValue = item.dataValues;
          newDataValue.presigned_url = presigned_url;
          item.dataValues = newDataValue;
          return item
          }))
        }
      //const numberofMountedCameraViewers = totalStreams.length > 0 ? await cameraServices.getAllMountedCameraViewers(totalStreams.flatMap(i => i.cam_id)) : 0
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {
          totalStreams: totalStreams ? totalStreams : [],
          enrolledStreams: totalStreams ? totalStreams.length : 0,
          activeStreams: activeStreams ? activeStreams.length : 0,
          numberofActiveStreamViewers: numberofActiveStreamViewers || 0,
          numberofMountedCameraViewers: numberofMountedCameraViewers || 0,
          activeLiveStreams: activeLiveStreams ? activeLiveStreams : [],
          recentLiveStreams: recentLiveStreams ? recentLiveStreams : [],
          childrens: childrens ? childrens.length : 0,
          // familyMembers: familyMembers ? familyMembers.length : 0,
          users: users ? users.length : 0,
          families: families ? families.length : 0,
          SEAMembers: SEAMembers ? SEAMembers : 0,
          topViewers: topViewers ? topViewers : "",
          recentViewers: recentViewers?.length != 0 ? recentViewers.length : 0,
          // childSEA: childSEA,
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
      console.log('==error==',error);
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
