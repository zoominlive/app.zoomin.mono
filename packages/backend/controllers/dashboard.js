const cameraServices = require("../services/cameras");
const familyServices = require("../services/families");
const childrenServices = require("../services/children");
const dashboardServices = require("../services/dashboard");
const watchStreamServices = require("../services/watchStream");
const customerServices = require("../services/customers");
const liveStreamServices = require("../services/liveStream");
const userServices = require("../services/users");
const s3BucketImageUploader = require("../lib/aws-services");
const cache = require("../lib/cache");
const { listAvailableStreams } = require("../lib/rtsp-stream");
const _ = require("lodash");
const { sequelize } = require('../lib/database');
const CONSTANTS = require("../lib/constants");
const { cons } = require("lodash-contrib");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
module.exports = {
  // get all stream statistics data to populate dashboard
  getStreamStatistics: async (req, res, next) => {
    try {
      const custId = req.user.cust_id || req.query.cust_id;
      const userId = req.user.user_id;
      let defaultWatchStream = req.user?.dashboard_cam_preference || {};

      // Prepare defaultWatchStream URL enrichment concurrently
      let baseUrlPromise = Promise.resolve(null);
      if (defaultWatchStream && defaultWatchStream?.cameras?.stream_uri) {
        const uid = userId;
        const sid = defaultWatchStream?.cameras?.cam_id;
        const uuid = uuidv4();
        const stream_uri = new URL(defaultWatchStream?.cameras?.stream_uri).pathname;
        const seckey = jwt.sign({ user_id: uid, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
        baseUrlPromise = customerServices.getTranscoderUrlFromCustLocations(req.user?.locations?.map((item) => item.loc_id), custId).then((baseUrl) => {
          defaultWatchStream.cameras.stream_uri = `${baseUrl}${stream_uri}?seckey=${seckey}`;
          return baseUrl;
        });
      }

      if (req.user.role === "Super Admin") {
        let watchStream = await dashboardServices.getCamPreference(custId);
        defaultWatchStream = watchStream || {};
      }

      if(req.user.role !== "Super Admin"){
        let updateObj = { user_id: userId, dashboard_locations: req?.query?.location };
        await sequelize.transaction(async (t) => {
          await userServices.editUserProfile( updateObj, _.omit(updateObj, ["user_id"]), t);
        });
      }

      const token = req.userToken;

      // Run independent I/O in parallel with short-lived caching
      const locationKey = req?.query?.location || "All";
      const [
        streams,
        totalStreams,
        SEAMembersRaw,
        childSEA,
        topViewers,
        recentViewers,
        camerasRaw,
        customerDetails,
        activeLiveStreams,
        childrens,
        families,
        users,
        recentLiveStreamsRaw,
      ] = await Promise.all([
        cache.getOrSet(`las:${custId}:${locationKey}`, 5000, () => listAvailableStreams(token, locationKey)),
        cache.getOrSet(`cams:${custId}:${locationKey}`, 10000, () => cameraServices.getAllCameraForCustomerDashboard(custId, locationKey)),
        cache.getOrSet(`seaMembers:${userId}`, 30000, () => familyServices.getFamilyWithSEA(userId)),
        cache.getOrSet(`childSEA:${custId}:${locationKey}`, 30000, () => dashboardServices.getChildrenWithSEA(custId, locationKey)),
        cache.getOrSet(`topViewers:${custId}:${locationKey}`, 30000, () => dashboardServices.topViewersOfTheWeek(
          req.user,
          req.query?.cust_id,
          locationKey
        )),
        cache.getOrSet(`recentViewers:${custId}:${locationKey}`, 30000, () => dashboardServices.getLastOneHourViewers(
          req.user,
          req.query?.cust_id,
          locationKey
        )),
        cache.getOrSet(`camsByLoc:${custId}:${userId}:${locationKey}`, 60000, () => watchStreamServices.getAllCamForLocation({
          ...req.user,
          cust_id: custId,
        })),
        cache.getOrSet(`customerDetails:${custId}`, 300000, () => customerServices.getCustomerDetails(custId)),
        cache.getOrSet(`activeLive:${custId}:${locationKey}`, 5000, () => liveStreamServices.getAllActiveStreams(custId, locationKey)),
        cache.getOrSet(`childrens:${custId}:${locationKey}`, 30000, () => childrenServices.getAllChildren(custId, locationKey)),
        cache.getOrSet(`families:${custId}:${locationKey}`, 60000, () => familyServices.getAllFamilyIds(custId, locationKey)),
        cache.getOrSet(`users:${custId}:${locationKey}`, 60000, () => userServices.getAllUserIds(custId, locationKey)),
        cache.getOrSet(`recentStreams:${custId}:${locationKey}`, 10000, () => liveStreamServices.getRecentStreams(custId, locationKey)),
      ]);

      // Compute active streams efficiently
      const runningIds = new Set((streams?.data || []).filter((s) => s.running === true).map((s) => s.id));
      const activeStreams = (totalStreams || []).filter((s) => runningIds.has(s.stream_uuid));

      // Build children enable/disable lists
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
      let SEAMembers = (SEAMembersRaw?.length || 0) + (childSEA?.length || 0);

      // Dependent calls after initial parallel batch
      const numberofMountedCameraViewers =  (totalStreams?.length > 0)
        ? await cache.getOrSet(`mountedViewers:${(totalStreams.flatMap(i => i.cam_id)).sort().join(',')}`, 5000, () => cameraServices.getAllMountedCameraViewers(totalStreams.flatMap(i => i.cam_id)))
        : 0;
      const numberofActiveStreamViewers = (activeLiveStreams.length > 0)
        ? await cache.getOrSet(`activeViewers:${(activeLiveStreams.flatMap(i => i.stream_id)).sort().join(',')}`, 5000, () => liveStreamServices.getAllActiveStreamViewers(activeLiveStreams.flatMap(i => i.stream_id)))
        : 0;

      // Prepare cameras with customer details
      let cameras = _.uniqBy(camerasRaw, "zone_id");
      cameras?.forEach((cam, camIndex) => {
        cameras[camIndex].timeout = customerDetails.timeout;
        cameras[camIndex].permit_audio = customerDetails.permit_audio;
      });

      // Enrich recent live streams with presigned URLs
      let recentLiveStreams = recentLiveStreamsRaw;
      if(recentLiveStreams.length > 0){
        recentLiveStreams = await Promise.all(recentLiveStreams.map(async item => {
          const key = item?.dataValues?.s3_url;
          const presigned_url = key ? await cache.getOrSet(`presign:${key}`, 60000, () => s3BucketImageUploader.getPresignedUrl(key)) : "";
          let newDataValue = item.dataValues;
          newDataValue.presigned_url = presigned_url;
          item.dataValues = newDataValue;
          return item;
        }));
      }

      // Ensure any pending defaultWatchStream enrichment is applied
      await baseUrlPromise;

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
