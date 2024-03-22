process.on("uncaughtException", function (err) {
  console.error("Error:", err);
});

const _ = require("lodash");
const moment = require("moment");
const customerServices = require("../services/customers");
const liveStreamServices = require("../services/liveStream");
const childServices = require("../services/children");
const familyServices = require("../services/families");
const socketServices = require("../services/socket");
const fcmTokensServices = require("../services/fcmTokens");
const logServices = require("../services/logs");
const liveStramcameraServices = require("../services/livestreamCameras");
const dashboardServices = require("../services/dashboard");
const userServices = require("../services/users");
const notificationSender = require("../lib/firebase-services");
const s3BucketImageUploader = require("../lib/aws-services");
const CONSTANTS = require("../lib/constants");
const sequelize = require("../lib/database");
const { v4: uuidv4 } = require("uuid");
const rooms = require("../services/rooms");
module.exports = {
  // get endpoint
  getEndpoint: async (req, res, next) => {
    const t = await sequelize.transaction();
    let response;
    try {
      const { roomID, streamName } = req.query;
      const { user_id, stream_live_license, cust_id } = req.user;
      const streams = await liveStreamServices.getstreamObjByUserId(user_id, t);
      const hasRunningStream = streams.some(stream => stream.dataValues.stream_running); //check if atleast one of the streams is running

      const streamsByRoom = await liveStreamServices.getstreamObjByRoomId(roomID, t);
      const hasRunningStreamRooms = streamsByRoom.some(stream => stream.stream_running); //check if atleast one of the streams is running
      const roomObj = await rooms.getRoomDetailsByRoomId(roomID, t);
      if (stream_live_license) {
        if(!hasRunningStream){
          let rtmpTranscoderBaseUrl = await customerServices.getRTMPTranscoderUrl(
            cust_id
          );
          let current_time = moment().toISOString();
          let streamID = uuidv4();
          let streamKeyAuth = await liveStreamServices.createStreamKeyToken(
            streamID
          );
          let openChannelData = await liveStreamServices.createOpenChannel();
          let endPoint = `${rtmpTranscoderBaseUrl}/stream/${streamID}?auth=${streamKeyAuth.token}`;
          let liveStreamObj = {
            stream_id: streamID,
            cust_id: cust_id,
            user_id: user_id,
            room_id: roomID,
            stream_name: streamName,
            sendbird_channel_url: openChannelData?.channel_url ? openChannelData?.channel_url : '',
            hls_url: `https://zoominstreamprocessing.s3.us-west-2.amazonaws.com/liveStream/${streamID}_${current_time}/index.m3u8`,
          };
          let livestream = await liveStreamServices.createLiveStream(
            liveStreamObj
          );
          response = { 
            serverEndPoint: endPoint,
            openChannelData: openChannelData
          };
          // try {
          // const { streamID } = req.query;
  
          // } catch (error) {
          //   await t.rollback();
          //   res.status(500).json({
          //     IsSuccess: false,
          //     error_log: error,
          //     Message: CONSTANTS.INTERNAL_SERVER_ERROR
          //   });
          //   next(error);
          // }
          await t.commit();
          res.status(200).json({
            IsSuccess: true,
            Data: response,
            Message: CONSTANTS.RTMP_ENDPOINT,
          });
        }
        else{
          await t.rollback();
          res.status(400).json({
            IsSuccess: true,
            Data: { room_id: roomID },
            Message: CONSTANTS.LIVE_STREAM_NOT_ALLOWED,
          });
        }
      } else if(!stream_live_license && roomObj.stream_live_license) {
        if(!hasRunningStreamRooms){
          let rtmpTranscoderBaseUrl = await customerServices.getRTMPTranscoderUrl(
            cust_id
          );
          let current_time = moment().toISOString();
          let streamID = uuidv4();
          let streamKeyAuth = await liveStreamServices.createStreamKeyToken(
            streamID
          );
  
          let endPoint = `${rtmpTranscoderBaseUrl}/stream/${streamID}?auth=${streamKeyAuth.token}`;
          let liveStreamObj = {
            stream_id: streamID,
            cust_id: cust_id,
            user_id: user_id,
            room_id: roomID,
            stream_name: streamName,
            hls_url: `https://zoominstreamprocessing.s3.us-west-2.amazonaws.com/liveStream/${streamID}_${current_time}/index.m3u8`,
          };
          let livestream = await liveStreamServices.createLiveStream(
            liveStreamObj
          );
          response = { serverEndPoint: endPoint };
          // try {
          // const { streamID } = req.query;
  
          // } catch (error) {
          //   await t.rollback();
          //   res.status(500).json({
          //     IsSuccess: false,
          //     error_log: error,
          //     Message: CONSTANTS.INTERNAL_SERVER_ERROR
          //   });
          //   next(error);
          // }
          await t.commit();
          res.status(200).json({
            IsSuccess: true,
            Data: response,
            Message: CONSTANTS.RTMP_ENDPOINT,
          });
        } 
        else{
          await t.rollback();
          res.status(400).json({
            IsSuccess: true,
            Data: { room_id: roomID },
            Message: CONSTANTS.LIVE_STREAM_ROOM_NOT_ALLOWED,
          });
        }
      } else {
        await t.rollback();
        res.status(401).json({
          IsSuccess: true,
          Data: { room_id: roomID },
          Message: CONSTANTS.LIVE_STREAM_UNAUTHORIZE,
        });
      }
      next();
    } catch (error) {
      await t.rollback();
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
        function: "Live_stream",
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

  startLiveStream: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { streamID } = req.query;
      let streamObj = await liveStreamServices.getstreamObj(streamID, t);
      if (streamObj.stream_running) {
        await t.commit();
        res.status(200).json({
          IsSuccess: true,
          Data: { stream_id: streamID },
          Message: CONSTANTS.LIVE_STREAM_ALREADY_STARTED,
        });
        return;
      } else if (streamObj.stream_stop_time !== null) {
        await t.commit();
        res.status(200).json({
          IsSuccess: true,
          Data: { stream_id: streamID },
          Message: CONSTANTS.LIVE_STREAM_ALREADY_ENDED,
        });
        return;
      } else {
        let updateObj = {
          stream_running: true,
          stream_start_time: moment().toISOString(),
        };

        await liveStreamServices.updateLiveStream(streamID, updateObj, t);
        await liveStreamServices.saveEndPointInCamera(streamID, t);
        let roomID = await liveStreamServices.getRoom(streamID, t);
        let camObj = {
          cam_name: "Live Stream",
          room_id: roomID,
          stream_uri: `https://live.zoominlive.com/stream/${streamID}.m3u8`,
        };
        await liveStramcameraServices.createLivestreamCamera(camObj, t);
        let childs = await childServices.getChildOfAssignedRoomId(roomID, t);
        let childIds = childs.flatMap((i) => i.child_id);
        let familys = await childServices.getAllchildrensFamilyId(childIds, t);
        let familyIds = [...new Set(familys.flatMap((i) => i.family_id))];
        let familyMembers = await familyServices.getFamilyMembersIds(familyIds);
        let socketIds = familyMembers
          .flatMap((i) => i.socket_connection_id)
          .filter((i) => i !== null);
        let familyMembersIds = familyMembers.flatMap((i) => i.family_member_id);
        let fcmTokens = await fcmTokensServices.getFamilyMembersFcmTokens(
          familyMembersIds
        );
        fcmTokens = fcmTokens.flatMap((i) => i.fcm_token);
        fcmTokens = [...new Set(fcmTokens)].filter((i) => i !== null);
        let message = `${streamObj.stream_name} has started`;
        if (!_.isEmpty(fcmTokens)) {
          await notificationSender.sendNotification(
            "Live stream",
            message,
            "",
            fcmTokens,
            {
              stream_id: streamID,
              room_id: roomID,
              //stream_uri: camObj?.stream_uri,
              stream_uri: `${camObj?.stream_uri}?uid=${
                req?.user?.family_member_id || req?.user?.user_id
              }&sid=${
                camObj?.stream_uri
                  .split("/")
                  [camObj?.stream_uri.split("/").length - 1].split(".")[0]
              }&uuid=${uuidv4()}`,
            }
          );
        }
        if (!_.isEmpty(socketIds)) {
          await Promise.all(
            socketIds.map(async (id) => {
              await socketServices.emitResponse(id, { message: message });
            })
          );
        }

        // update dashboard details
        // let usersLocations = await userServices.getUsersSocketIds(streamObj.cust_id);
        // const activeLiveStreams = await liveStreamServices.getAllActiveStreams(streamObj.cust_id, usersLocations?.dashboard_locations, t);
        // await dashboardServices.updateDashboardData(streamObj.cust_id, {activeLiveStreams: activeLiveStreams});
        let usersdata = await userServices.getUsersSocketIds(streamObj?.cust_id);
        usersdata = usersdata.filter(user => user.socket_connection_id && user.dashboard_locations);
        
       if(!_.isEmpty(usersdata)){
        await Promise.all(
          usersdata.map(async (user) => {
            const activeLiveStreams = await liveStreamServices.getAllActiveStreams(streamObj?.cust_id, user?.dashboard_locations, t);
            let recentLiveStreams = await liveStreamServices.getRecentStreams(streamObj?.cust_id,user?.dashboard_locations,t);
             if (recentLiveStreams.length > 0) {
               recentLiveStreams = await Promise.all(
                 recentLiveStreams.map(async (item) => {
                   const presigned_url = item?.dataValues?.s3_url ?await s3BucketImageUploader.getPresignedUrl(item?.dataValues?.s3_url) : "";
                   let newDataValue = item.dataValues;
                   newDataValue.presigned_url = presigned_url;
                   item.dataValues = newDataValue;
                   return item;
                 })
               );
             }
            await socketServices.emitResponse(user?.socket_connection_id, {"activeLiveStreams": activeLiveStreams, "recentLiveStreams": recentLiveStreams});
          })
        );
       }

        await t.commit();
        res.status(200).json({
          IsSuccess: true,
          Data: { stream_id: streamID },
          Message: CONSTANTS.LIVE_STREAM_STARTED,
        });
      }
      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR,
      });
      next(error);
    } finally {
      let logObj = {
        //user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        user_id: req?.user?.family_member_id
          ? req?.user?.family_member_id
          : req?.user?.user_id
          ? req?.user?.user_id
          : "Not Found",
        function: "Live_Stream",
        function_type: "Start",
        request: req.query,
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  stopLiveStream: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { streamID } = req.query;
      const { s3_url } = req.body;
      let updateObj = {
        stream_running: false,
        stream_stop_time: moment().toISOString(),
        s3_url: s3_url,
      };

      await liveStreamServices.updateLiveStream(streamID, updateObj, t);
      await liveStreamServices.removeEndPointInCamera(streamID, t);

      let roomID = await liveStreamServices.getRoom(streamID, t);

      await liveStramcameraServices.deleteLivestreamCamera(roomID);

      let streamObj = await liveStreamServices.getstreamObj(streamID, t);
       

      let childs = await childServices.getChildOfAssignedRoomId(roomID, t);
      let childIds = childs.flatMap((i) => i.child_id);
      let familys = await childServices.getAllchildrensFamilyId(childIds, t);
      let familyIds = [...new Set(familys.flatMap((i) => i.family_id))];
      let familyMembers = await familyServices.getFamilyMembersIds(familyIds);
      let socketIds = familyMembers
        .flatMap((i) => i.socket_connection_id)
        .filter((i) => i !== null);
      let familyMembersIds = familyMembers.flatMap((i) => i.family_member_id);
      let fcmTokens = await fcmTokensServices.getFamilyMembersFcmTokens(
        familyMembersIds
      );
      fcmTokens = fcmTokens.flatMap((i) => i.fcm_token);
      fcmTokens = [...new Set(fcmTokens)].filter((i) => i !== null);
      let message = `${streamObj.stream_name} has stoped`;

      if (!_.isEmpty(fcmTokens)) {
        await notificationSender.sendNotification(
          "Live stream",
          message,
          "",
          fcmTokens,
          {
            stream_id: streamID,
            room_id: roomID,
            stream_uri: `https://live.zoominlive.com/stream/${streamID}.m3u8`,
          }
        );
      }
      if (!_.isEmpty(socketIds)) {
        await Promise.all(
          socketIds.map(async (id) => {
            await socketServices.emitResponse(id, message);
          })
        );
      }
      //console.log('====streamObj.cust_id===',streamObj.cust_id)
      // await dashboardServices.updateDashboardData(streamObj.cust_id);
      // console.log('====streamObj====',streamObj);
      // let usersLocations = await userServices.getUsersSocketIds(streamObj.cust_id);
      // const activeLiveStreams = await liveStreamServices.getAllActiveStreams(streamObj.cust_id, usersLocations?.dashboard_locations, t);
      // await dashboardServices.updateDashboardData(streamObj.cust_id, {activeLiveStreams: activeLiveStreams});

      let usersdata = await userServices.getUsersSocketIds(streamObj?.cust_id);
        usersdata = usersdata.filter(user => user.socket_connection_id && user.dashboard_locations);
        
       if (!_.isEmpty(usersdata)) {
         await Promise.all(
           usersdata.map(async (user) => {
             const activeLiveStreams =
               await liveStreamServices.getAllActiveStreams(
                 streamObj?.cust_id,
                 user?.dashboard_locations,
                 t
               );
             let recentLiveStreams = await liveStreamServices.getRecentStreams(
              streamObj?.cust_id,
              user?.dashboard_locations,
               t
             );
             if (recentLiveStreams.length > 0) {
               recentLiveStreams = await Promise.all(
                 recentLiveStreams.map(async (item) => {
                   const presigned_url = item?.dataValues?.s3_url ?
                     await s3BucketImageUploader.getPresignedUrl(
                       item?.dataValues?.s3_url
                     ) : "";
                   let newDataValue = item.dataValues;
                   newDataValue.presigned_url = presigned_url;
                   item.dataValues = newDataValue;
                   return item;
                 })
               );
             }

             await socketServices.emitResponse(user?.socket_connection_id, {
               activeLiveStreams: activeLiveStreams,
               recentLiveStreams: recentLiveStreams
             });
           })
         );
       }
       
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: { stream_id: streamID },
        Message: CONSTANTS.LIVE_STREAM_STOPPED,
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
    } finally {
      let logObj = {
        //user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        user_id: req?.user?.family_member_id
          ? req?.user?.family_member_id
          : req?.user?.user_id
          ? req?.user?.user_id
          : "Not Found",
        function: "Live_Stream",
        function_type: "Stop",
        request: req.query,
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  getstreamDetails: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { streamID } = req.query;
      let streamObj = await liveStreamServices.getstreamObj(streamID);
      let response = {
        room_id: streamObj?.room_id,
        cust_id: streamObj?.cust_id,
      };
      await t.commit();
      res.status(200).json({
        IsSuccess: streamObj ? true : false,
        Data: response,
        Message: streamObj
          ? CONSTANTS.LIVE_STREAM_DETAILS
          : CONSTANTS.LIVE_STREAM_DETAILS_NOT_FOUND,
      });
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

  addRecentViewers: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const recentViewer = await liveStreamServices.addRecentViewers(params);
      let user_family_obj = await userServices.getUserById(
        params?.recent_user_id,
        t
      );
      if (!user_family_obj) {
        user_family_obj = await familyServices.getFailyMemberById(
          params?.recent_user_id,
          t
        );
      }
      if (user_family_obj?.cust_id) {
        // const activeLiveStreams = await liveStreamServices.getAllActiveStreams(user_family_obj?.cust_id, req?.query?.location, t);
        // const numberofActiveStreamViewers = activeLiveStreams.length > 0 ? await liveStreamServices.getAllActiveStreamViewers(activeLiveStreams.flatMap(i => i.stream_id), t) : 0;
        
        // let usersLocations = await userServices.getUsersSocketIds(streamObj.cust_id);
        // const activeLiveStreams = await liveStreamServices.getAllActiveStreams(streamObj.cust_id, usersLocations?.dashboard_locations, t);
        
        // await dashboardServices.updateDashboardData(user_family_obj?.cust_id);

        // let usersLocations = await userServices.getUsersSocketIds(user_family_obj?.cust_id);
        // console.log('===usersLocations',usersLocations)
        //const activeLiveStreams = await liveStreamServices.getAllActiveStreams(user_family_obj?.cust_id, usersLocations?.dashboard_locations, t);
        //const numberofActiveStreamViewers = activeLiveStreams.length > 0 ? await liveStreamServices.getAllActiveStreamViewers(activeLiveStreams.flatMap(i => i.stream_id), t) : 0;
        
        let usersdata = await userServices.getUsersSocketIds(user_family_obj?.cust_id);
        usersdata = usersdata.filter(user => user.socket_connection_id && user.dashboard_locations);
        
       if(!_.isEmpty(usersdata)){
        await Promise.all(
          usersdata.map(async (user) => {
            const activeLiveStreams = await liveStreamServices.getAllActiveStreams(user_family_obj?.cust_id, user?.dashboard_locations, t);
            const numberofActiveStreamViewers = activeLiveStreams.length > 0 ? await liveStreamServices.getAllActiveStreamViewers(activeLiveStreams.flatMap(i => i.stream_id), t) : 0;
            await socketServices.emitResponse(user?.socket_connection_id, {"numberofActiveStreamViewers" : numberofActiveStreamViewers});
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
