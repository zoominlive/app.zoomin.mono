const connectToDatabase = require('../models/index');
const jwt = require('jsonwebtoken');
module.exports = {
  /* Create stream ID token */
  createStreamKeyToken: async (streamID) => {
    const token = jwt.sign({ stream_id: streamID }, process.env.LIVE_STREAM_SECRET_KEY);
    return { token };
  },

  createLiveStream: async (liveStreamObj, t) => {
    const { LiveStreams } = await connectToDatabase();
    let streamCreated = await LiveStreams.create(liveStreamObj, { transaction: t });
    return streamCreated;
  },

  updateLiveStream: async(user_id, stream_id, updateObj, t) => {
    const { LiveStreams } = await connectToDatabase();
    let streamCreated = await LiveStreams.update(updateObj, { where: {user_id: user_id, stream_id: stream_id} }, { transaction: t });
    return streamCreated;
  },

  saveEndPointInCamera: async(stream_id, t) => {
    const { LiveStreams, CamerasInRooms } = await connectToDatabase();
    let liveStreamObj = await LiveStreams.findOne({ where: {stream_id: stream_id}, attributes: ['room_id', 'hsl_url'], }, { transaction: t });
    let cameraUpdated = await CamerasInRooms.update({hsl_url: liveStreamObj?.dataValues?.hsl_url}, {where: {room_id: liveStreamObj?.dataValues?.room_id}})
    return cameraUpdated;
  },

  removeEndPointInCamera: async(stream_id, t) => {
    const { LiveStreams, CamerasInRooms } = await connectToDatabase();
    let liveStreamObj = await LiveStreams.findOne({ where: {stream_id: stream_id}, attributes: ['room_id', 'hsl_url'], }, { transaction: t });
    let cameraUpdated = await CamerasInRooms.update({hsl_url: null}, {where: {room_id: liveStreamObj?.dataValues?.room_id}})
    return cameraUpdated;
  },
  
  getRoom: async(stream_id, t) => {
    const { LiveStreams } = await connectToDatabase();
    let roomObj = await LiveStreams.findOne({ where: {stream_id: stream_id}, attributes: ['room_id'], }, { transaction: t });
    return roomObj?.dataValues?.room_id;
    
  }
};
