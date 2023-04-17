const _ = require('lodash');
const moment = require('moment');
const customerServices = require('../services/customers');
const liveStreamServices = require('../services/liveStream');
const childServices = require('../services/children');
const familyServices = require('../services/families');
const socketServices = require('../services/socket');
const notificationSender = require('../lib/firebase-services');
const CONSTANTS = require('../lib/constants');
const sequelize = require('../lib/database');
const { v4: uuidv4 } = require('uuid');
module.exports = {
  // get endpoint
  getEndpoint: async (req, res, next) => {
    try {
      const { roomID, streamName } = req.query;
      const { user_id, stream_live_license, cust_id } = req.user;
      if (stream_live_license) {
        let rtmpTranscoderBaseUrl = await customerServices.getRTMPTranscoderUrl(cust_id);
        let current_time = moment().toISOString();
        let streamID = uuidv4()
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

        res.status(200).json({
          IsSuccess: true,
          Data: { serverEndPont: endPoint },
          Message: CONSTANTS.RTMP_ENDPOINT
        });
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
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  startLiveStream: async (req, res, next) => {
    try {
      const t = await sequelize.transaction();
      const { streamID } = req.query;
      let updateObj = {stream_running: true, stream_start_time: moment().toISOString() };

      await liveStreamServices.updateLiveStream(streamID, updateObj, t);
      await liveStreamServices.saveEndPointInCamera(streamID, t);

      let roomID = await liveStreamServices.getRoom(streamID, t);
      let childs = await childServices.getChildOfAssignedRoomId(roomID, t);
      let childIds = childs.flatMap(i => i.child_id)
      let familys = await childServices.getAllchildrensFamilyId(childIds, t);
      let familyIds = [...new Set(familys.flatMap(i => i.family_id))];
      let fcmTokens = await familyServices.getFamilyMembersFcmTokens(familyIds);
      fcmTokens = fcmTokens.flatMap(i => i.fcm_token);
      
      await notificationSender.sendNotification('Live stream','Live stream is started', '', fcmTokens.filter(i => i!== null), {stream_id: streamID, room_id: roomID});
      let connectionObj = await socketServices.getConnectionId(t);
      console.log('====',connectionObj);
      if(connectionObj){
        await socketServices.displayNotification1(connectionObj?.connection_id);
      }
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.LIVE_STREAM_STARTED
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

  stopLiveStream: async (req, res, next) => {
    try {
      const t = await sequelize.transaction();
      const { streamID } = req.query;
      let updateObj = {stream_running: false, stream_stop_time: moment().toISOString() };

      await liveStreamServices.updateLiveStream(streamID, updateObj, t);
      await liveStreamServices.removeEndPointInCamera(streamID, t);
      
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.LIVE_STREAM_STOPPED
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
}
