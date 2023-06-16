process.on("uncaughtException", function (err) {
  console.error("Error:", err);
});

const _ = require('lodash');
const moment = require('moment');
const customerServices = require('../services/customers');
const liveStreamServices = require('../services/liveStream');
const childServices = require('../services/children');
const familyServices = require('../services/families');
const socketServices = require('../services/socket');
const fcmTokensServices = require('../services/fcmTokens');
const logServices = require('../services/logs');
const liveStramcameraServices = require('../services/livestreamCameras');
// const socketServices = require('../services/socket');
const notificationSender = require('../lib/firebase-services');
const CONSTANTS = require('../lib/constants');
const sequelize = require('../lib/database');
const { v4: uuidv4 } = require('uuid');
module.exports = {
  // get endpoint
  getEndpoint: async (req, res, next) => {
    const t = await sequelize.transaction();
    let response;
    try {
      const { roomID, streamName } = req.query;
      const { user_id, stream_live_license, cust_id } = req.user;
      if (stream_live_license) {
        let rtmpTranscoderBaseUrl = await customerServices.getRTMPTranscoderUrl(cust_id);
        let current_time = moment().toISOString();
        let streamID = uuidv4();
        let streamKeyAuth = await liveStreamServices.createStreamKeyToken(streamID);

        let endPoint = `${rtmpTranscoderBaseUrl}/stream/${streamID}?auth=${streamKeyAuth.token}`;
        let liveStreamObj = {
          stream_id: streamID,
          cust_id: cust_id,
          user_id: user_id,
          room_id: roomID,
          stream_name: streamName,
          hls_url: `https://zoominstreamprocessing.s3.us-west-2.amazonaws.com/liveStream/${streamID}_${current_time}/index.m3u8`
        };
        let livestream = await liveStreamServices.createLiveStream(liveStreamObj);
        response = { serverEndPoint: endPoint };
        // try {
          // const { streamID } = req.query;
          let streamObj = await liveStreamServices.getstreamObj(streamID, t)
          if(streamObj.stream_running){
            await t.commit();
            res.status(200).json({
              IsSuccess: true,
              Data: {},
              Message: CONSTANTS.LIVE_STREAM_ALREADY_STARTED
            });
            return
          }
          else{
    
          let updateObj = {stream_running: true, stream_start_time: moment().toISOString() };
            
          await liveStreamServices.updateLiveStream(streamID, updateObj, t);
          await liveStreamServices.saveEndPointInCamera(streamID, t);
          let roomID = await liveStreamServices.getRoom(streamID, t);
         let camObj = {
          cam_name: "Live Stream",
          room_id: roomID,
          stream_uri: `https://live.zoominlive.com/stream/${streamID}.m3u8`
          
         }
          await liveStramcameraServices.createLivestreamCamera(camObj, t)
          let childs = await childServices.getChildOfAssignedRoomId(roomID, t);
          let childIds = childs.flatMap(i => i.child_id)
          let familys = await childServices.getAllchildrensFamilyId(childIds, t);
          let familyIds = [...new Set(familys.flatMap(i => i.family_id))];
          let familyMembers = await familyServices.getFamilyMembersIds(familyIds);
          let socketIds = familyMembers.flatMap(i => i.socket_connection_id).filter(i => i!== null);
          let familyMembersIds = familyMembers.flatMap( i => i.family_member_id);
          let fcmTokens = await fcmTokensServices.getFamilyMembersFcmTokens(familyMembersIds);
          fcmTokens = fcmTokens.flatMap(i => i.fcm_token);
          fcmTokens = [...new Set(fcmTokens)].filter(i => i!== null);
          if(!_.isEmpty(fcmTokens)){
            await notificationSender.sendNotification('Live stream',`${streamObj.stream_name} has started`, '', fcmTokens , {stream_id: streamID, room_id: roomID, stream_uri: camObj?.stream_uri});
          }
          if(!_.isEmpty(socketIds)){
            await Promise.all(socketIds.map(async id => {
              await socketServices.emitResponse(id);
            }));
          }
          await t.commit();
           res.status(200).json({
          IsSuccess: true,
          Data: response,
          Message: CONSTANTS.RTMP_ENDPOINT
        });
        }
          next();
        // } catch (error) {
        //   await t.rollback();
        //   res.status(500).json({
        //     IsSuccess: false,
        //     error_log: error,
        //     Message: CONSTANTS.INTERNAL_SERVER_ERROR
        //   });
        //   next(error);
        // }
        // res.status(200).json({
        //   IsSuccess: true,
        //   Data: response,
        //   Message: CONSTANTS.RTMP_ENDPOINT
        // });
      }
      else {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.LIVE_STREAM_UNAUTHORIZE
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
        user_id: req?.user?.family_member_id
          ? req?.user?.family_member_id
          : req?.user?.user_id
          ? req?.user?.user_id
          : 'Not Found',
        function: 'Live_stream',
        function_type: 'Get',
        response: response
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
      let streamObj = await liveStreamServices.getstreamObj(streamID, t)
      if(streamObj.stream_running){
        await t.commit();
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.LIVE_STREAM_ALREADY_STARTED
        });
        return
      }
      else{

      let updateObj = {stream_running: true, stream_start_time: moment().toISOString() };
        
      await liveStreamServices.updateLiveStream(streamID, updateObj, t);
      await liveStreamServices.saveEndPointInCamera(streamID, t);
      let roomID = await liveStreamServices.getRoom(streamID, t);
     let camObj = {
      cam_name: "Live Stream",
      room_id: roomID,
      stream_uri: `https://live.zoominlive.com/stream/${streamID}.m3u8`
     }
      await liveStramcameraServices.createLivestreamCamera(camObj, t)
      let childs = await childServices.getChildOfAssignedRoomId(roomID, t);
      let childIds = childs.flatMap(i => i.child_id)
      let familys = await childServices.getAllchildrensFamilyId(childIds, t);
      let familyIds = [...new Set(familys.flatMap(i => i.family_id))];
      let familyMembers = await familyServices.getFamilyMembersIds(familyIds);
      let socketIds = familyMembers.flatMap(i => i.socket_connection_id).filter(i => i!== null);
      let familyMembersIds = familyMembers.flatMap( i => i.family_member_id);
      let fcmTokens = await fcmTokensServices.getFamilyMembersFcmTokens(familyMembersIds);
      fcmTokens = fcmTokens.flatMap(i => i.fcm_token);
      fcmTokens = [...new Set(fcmTokens)].filter(i => i!== null);
      if(!_.isEmpty(fcmTokens)){
        await notificationSender.sendNotification('Live stream',`${streamObj.stream_name} has started`, '', fcmTokens , {stream_id: streamID, room_id: roomID, stream_uri: camObj?.stream_uri});
      }
      if(!_.isEmpty(socketIds)){
        await Promise.all(socketIds.map(async id => {
          await socketServices.emitResponse(id);
        }));
      }
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.LIVE_STREAM_STARTED
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
        //user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        user_id: req?.user?.family_member_id
          ? req?.user?.family_member_id
          : req?.user?.user_id
          ? req?.user?.user_id
          : 'Not Found',
        function: 'Live_Stream',
        function_type: 'Start',
        request: req.query
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
      let updateObj = {stream_running: false, stream_stop_time: moment().toISOString() };

      await liveStreamServices.updateLiveStream(streamID, updateObj, t);
      await liveStreamServices.removeEndPointInCamera(streamID, t);

      let roomID = await liveStreamServices.getRoom(streamID, t);
      await liveStramcameraServices.deleteLivestreamCamera(roomID);
      
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.LIVE_STREAM_STOPPED
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
        //user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        user_id: req?.user?.family_member_id
          ? req?.user?.family_member_id
          : req?.user?.user_id
          ? req?.user?.user_id
          : 'Not Found',
        function: 'Live_Stream',
        function_type: 'Stop',
        request: req.query
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  }
}
