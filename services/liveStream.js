const connectToDatabase = require('../models/index');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');


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

  getAllActiveStreams: async (cust_id, location='All', t) => {
    const { LiveStreams, Room, LiveStreamCameras } = await connectToDatabase();
    let loc_obj = location === "All" ? {} : {location: location};
    
    let activeLiveStreams = await LiveStreams.findAll(
      { where: { stream_running: true, cust_id: cust_id }, attributes:["stream_name", "stream_start_time", "room_id"], 
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
    },
      { transaction: t }
    );
    return activeLiveStreams;
  },

  getRecentStreams: async(cust_id, location='All', t)=> {
    const { LiveStreams, Room, LiveStreamCameras } = await connectToDatabase();
    let loc_obj = location === "All" ? {} : {location: location}
    let oneHourBefore = new Date();
    oneHourBefore.setHours(oneHourBefore.getHours() - 1);
    const currentTime = new Date();

    let recentLiveStreams = await LiveStreams.findAll(
      { where: { stream_running: false, cust_id: cust_id,  stream_start_time: {
        [Sequelize.Op.between]: [
          oneHourBefore.toISOString(),
          currentTime.toISOString(),
        ],
      }, }, attributes:["stream_id", "stream_start_time"],
      include: [{
        model: Room,
        as: "room",
        where: loc_obj,
        include: [
          {
            model: LiveStreamCameras,
          }
        ]
      }], },
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
};
