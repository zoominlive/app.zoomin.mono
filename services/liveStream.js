const connectToDatabase = require('../models/index');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const moment = require('moment');
const sequelize = require("../lib/database");

module.exports = {
  /* Create stream ID token */
  createStreamKeyToken: async (streamID) => {
    const token = jwt.sign(
      { stream_id: streamID },
      process.env.LIVE_STREAM_SECRET_KEY
    );
    return { token };
  },

  createLiveStream: async (liveStreamObj, t) => {
    const { LiveStreams } = await connectToDatabase();
    let streamCreated = await LiveStreams.create(liveStreamObj, {
      transaction: t,
    });
    return streamCreated;
  },

  updateLiveStream: async (stream_id, updateObj, t) => {
    const { LiveStreams } = await connectToDatabase();
    let streamUpdated = await LiveStreams.update(
      updateObj,
      { where: { stream_id: stream_id } },
      { transaction: t }
    );
    return streamUpdated;
  },

  saveEndPointInCamera: async (stream_id, t) => {
    const { LiveStreams, CamerasInRooms, Camera } = await connectToDatabase();
    let liveStreamObj = await LiveStreams.findOne(
      { where: { stream_id: stream_id }, attributes: ["room_id", "hls_url"] },
      { transaction: t }
    );
    let cameraUpdated = await CamerasInRooms.update(
      { hls_url: liveStreamObj?.dataValues?.hls_url },
      { where: { room_id: liveStreamObj?.dataValues?.room_id } }
    );
    return cameraUpdated;
  },

  removeEndPointInCamera: async (stream_id, t) => {
    const { LiveStreams, CamerasInRooms } = await connectToDatabase();
    let liveStreamObj = await LiveStreams.findOne(
      { where: { stream_id: stream_id }, attributes: ["room_id", "hls_url"] },
      { transaction: t }
    );
    let cameraUpdated = await CamerasInRooms.update(
      { hls_url: null },
      { where: { room_id: liveStreamObj?.dataValues?.room_id } }
    );
    return cameraUpdated;
  },

  getRoom: async (stream_id, t) => {
    const { LiveStreams } = await connectToDatabase();
    let roomObj = await LiveStreams.findOne(
      { where: { stream_id: stream_id }, attributes: ["room_id"] },
      { transaction: t }
    );
    return roomObj?.dataValues?.room_id;
  },

  getstreamObj: async (stream_id, t) => {
    const { LiveStreams } = await connectToDatabase();
    let roomObj = await LiveStreams.findOne(
      { where: { stream_id: stream_id } },
      { transaction: t }
    );
    return roomObj?.dataValues;
  },

  getstreamObjByUserId: async (user_id, t) => {
    const { LiveStreams } = await connectToDatabase();
    let streamsArray = await LiveStreams.findAll(
      { 
        where: { user_id: user_id },
      },
      { transaction: t }
    );
    return streamsArray;
  },

  getstreamObjByRoomId: async (room_id, t) => {
    const { LiveStreams } = await connectToDatabase();
    let streamsArray = await LiveStreams.findAll(
      { 
        where: { room_id: room_id },
      },
      { transaction: t }
    );
    return streamsArray;
  },

  getAllActiveStreams: async (cust_id, location='All', t) => {
    const { LiveStreams, Room, LiveStreamCameras } = await connectToDatabase();
    let loc_obj = location === "All" ? {} : {location: location};
    
    let activeLiveStreams = await LiveStreams.findAll(
      { where: { stream_running: true, cust_id: cust_id }, 
        order: [ ['stream_start_time', 'DESC'] ], 
        attributes:["stream_id","stream_name", "stream_start_time", "room_id"], 
        include: [{
         model: Room,
         as: "room",
         where: loc_obj,
         include: [
           {
             model: LiveStreamCameras,
           }
         ]
        }]
      },
      { transaction: t }
    );
    return activeLiveStreams;
  },

  getRecentStreams: async(cust_id, location='All', t)=> {
    const { LiveStreams, Room, LiveStreamCameras } = await connectToDatabase();
    let loc_obj = location === "All" ? {} : {location: location}
    // let oneHourBefore = new Date();
    // oneHourBefore.setHours(oneHourBefore.getHours() - 24);
    const currentDate = new Date();
    const last24Hours = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000));

    let recentLiveStreams = await LiveStreams.findAll(
      { where: { stream_running: false, cust_id: cust_id },  
        order: [ ['stream_stop_time', 'DESC'] ],
        attributes:["stream_id", "stream_name", "stream_start_time", "stream_stop_time", "s3_url"],
        include: [{
         model: Room,
         as: "room",
         where: loc_obj,
         include: [
           {
             model: LiveStreamCameras,
           }
         ]
        }],
        limit: 10
      },
      { transaction: t }
    );
    return recentLiveStreams;
  },

  addRecentViewers: async (params, t) => {
    const { LiveStreamRecentViewers } = await connectToDatabase();
    let recentViewerObj = {
      ...params,
      requested_at: Sequelize.literal("CURRENT_TIMESTAMP"),
    };
    let recentViewer = await LiveStreamRecentViewers.create(
      recentViewerObj,
      { transaction: t }
    );

    return recentViewer;
  },

  getAllActiveStreamViewers: async (streamIds, t) => {
    // const { LiveStreamRecentViewers, LiveStreams } = await connectToDatabase();
    // let recentViewers = await LiveStreamRecentViewers.findAll(
    //   { where: {function: "start"}, 
    //   include:[{
    //     model: LiveStreams,
    //     where: { stream_id: { [Sequelize.Op.in]: streamIds } }
    //   }], group: ["viewer_id"] },
    //   { transaction: t }
    // );
let result = await sequelize
 .query(
    'SELECT COUNT(DISTINCT sub.viewer_id) AS total_start_only_viewers FROM (SELECT viewer_id FROM live_stream_recent_viewers WHERE `function` = "start" AND stream_id IN (:streamIds) GROUP BY viewer_id) AS sub WHERE NOT EXISTS (SELECT 1 FROM live_stream_recent_viewers WHERE `function` = "stop" AND viewer_id = sub.viewer_id)',
    { replacements: { streamIds }, type: sequelize.QueryTypes.SELECT }
 )
return result[0].total_start_only_viewers;
  },

  getRecordedStreams: async(cust_id, from =  moment().format('YYYY-MM-DD 00:00'), to =  moment(to).format('YYYY-MM-DD 23:59'), location='All', rooms="All", live = true, vod = true, t)=> {
    const { LiveStreams, Room, LiveStreamCameras } = await connectToDatabase();
    let where_obj = location === "All" ? {} : {location: location}
    let status_obj = live == "true" && vod == "true" ? {}: {stream_running: live == "true" ? true : false}
    
    if(rooms !== "All" & rooms.length > 0){
      where_obj = {...where_obj, room_name: rooms}
    }
    
    let recordedStreams = await LiveStreams.findAll(
      { where: { cust_id: cust_id, ...status_obj,
      stream_start_time: {
        [Sequelize.Op.between]: [from, to],
      },
     }, 
       attributes:["stream_id", "stream_name","stream_running", "s3_url", "created_at"],
      include: [{
        model: Room,
        where: where_obj,
        as: "room",
        include: [
          {
            model: LiveStreamCameras,
          }
        ]
      }], },
      { transaction: t }
    );
    return recordedStreams;
  }
};
