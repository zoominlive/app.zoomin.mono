const connectToDatabase = require('../models/index');
const jwt = require('jsonwebtoken');
const Sequelize = require('sequelize');
const moment = require('moment');
const sequelize = require("../lib/database");
const axios = require('axios');
const { uuidv4 } = require('@firebase/util');

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
    const { LiveStreams, CamerasInZones, Camera } = await connectToDatabase();
    let liveStreamObj = await LiveStreams.findOne(
      { where: { stream_id: stream_id }, attributes: ["zone_id", "hls_url"] },
      { transaction: t }
    );
    let cameraUpdated = await CamerasInZones.update(
      { hls_url: liveStreamObj?.dataValues?.hls_url },
      { where: { zone_id: liveStreamObj?.dataValues?.zone_id } }
    );
    return cameraUpdated;
  },

  removeEndPointInCamera: async (stream_id, t) => {
    const { LiveStreams, CamerasInZones } = await connectToDatabase();
    let liveStreamObj = await LiveStreams.findOne(
      { where: { stream_id: stream_id }, attributes: ["zone_id", "hls_url"] },
      { transaction: t }
    );
    let cameraUpdated = await CamerasInZones.update(
      { hls_url: null },
      { where: { zone_id: liveStreamObj?.dataValues?.zone_id } }
    );
    return cameraUpdated;
  },

  getZone: async (stream_id, t) => {
    const { LiveStreams } = await connectToDatabase();
    let zoneObj = await LiveStreams.findOne(
      { where: { stream_id: stream_id }, attributes: ["zone_id"] },
      { transaction: t }
    );
    return zoneObj?.dataValues?.zone_id;
  },

  getstreamObj: async (stream_id, t) => {
    const { LiveStreams } = await connectToDatabase();
    let zoneObj = await LiveStreams.findOne(
      { where: { stream_id: stream_id } },
      { transaction: t }
    );
    return zoneObj?.dataValues;
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

  getstreamObjByZoneId: async (zone_id, t) => {
    const { LiveStreams } = await connectToDatabase();
    let streamsArray = await LiveStreams.findAll(
      { 
        where: { zone_id: zone_id },
      },
      { transaction: t }
    );
    return streamsArray;
  },

  getActiveStreamObjByZoneId: async (zone_id, t) => {
    const { LiveStreams } = await connectToDatabase();
    let streamsArray = await LiveStreams.findAll(
      { 
        where: { zone_id: zone_id, stream_running: true },
        raw: true
      },
      { transaction: t }
    );
    return streamsArray;
  },

  getAllActiveStreams: async (cust_id, location='All', t) => {
    const { LiveStreams, Zone, LiveStreamCameras } = await connectToDatabase();
    let loc_obj = location === "All" ? {} : {loc_id: location};
    
    let activeLiveStreams = await LiveStreams.findAll(
      { where: { stream_running: true, cust_id: cust_id }, 
        order: [ ['stream_start_time', 'DESC'] ], 
        attributes:["stream_id","stream_name", "stream_start_time", "zone_id"], 
        include: [{
         model: Zone,
         as: "zone",
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
    const { LiveStreams, Zone, LiveStreamCameras } = await connectToDatabase();
    let loc_obj = location === "All" ? {} : {loc_id: location}
    // let oneHourBefore = new Date();
    // oneHourBefore.setHours(oneHourBefore.getHours() - 24);
    const currentDate = new Date();
    const last24Hours = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000));

    let recentLiveStreams = await LiveStreams.findAll(
      { where: { stream_running: false, cust_id: cust_id },  
        order: [ ['stream_stop_time', 'DESC'] ],
        attributes:["stream_id", "stream_name", "stream_start_time", "stream_stop_time", "s3_url"],
        include: [{
         model: Zone,
         as: "zone",
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

  getFixedCameraRecordings: async (user_id, from, to, location='All', sortBy, pageNumber, pageSize, tags) => {
    const { RecordRtsp, Camera, RecordTag, CustomerLocations } = await connectToDatabase();
    let recentFixedCamRecordings = await RecordRtsp.findAndCountAll(
      { 
        where: { 
            active: false, 
            user_id: user_id, 
            ...(tags !== "All" && { tag_id: tags }), // Include `tag_id` only if `tags` is not "All"
            start_time: {
            [Sequelize.Op.between]: [
              moment(from).startOf('day').toISOString(),
              moment(to).endOf('day').toISOString()
            ],
          }, 
        },  
        order: [ ['start_time', sortBy] ],
        include: [
          {
            model: Camera,
            as: 'record_camera_tag',
            where: {
              ...(location !== "All" && { where: { loc_id: location } }), // Include `where` only if `location` is not "All"
            },
            include: [
              {
                model: CustomerLocations,
              }
            ]
          },
          {
            model: RecordTag,
            as: 'record_tag'
          },
        ],
        limit: parseInt(pageSize),
        offset: parseInt(pageNumber * pageSize),
      }
    );  
    return {data: recentFixedCamRecordings.rows, count: recentFixedCamRecordings.count};
  },

  getFixedCameraRecordingsByUser: async (user_id) => {
    const { RecordRtsp, RecordTag } = await connectToDatabase();
    let recentFixedCamRecordingsByUser = await RecordRtsp.findAndCountAll(
      { 
        where: { 
            active: true, 
            user_id: user_id,
        },  
        order: [ ['start_time', 'DESC'] ],
        attributes: ['record_uuid', 'active', 'user_id', 'cam_id', 'start_time', 'tag_id'],
        include: [
          {
            model: RecordTag,
            as: "record_tag"
          }
        ]
      }
    );  
    return {data: recentFixedCamRecordingsByUser.rows, count: recentFixedCamRecordingsByUser.count};
  },

  getRecentFixedCameraRecordings: async (user_id, location='All', tags) => {
    const { RecordRtsp, Camera, RecordTag, CustomerLocations } = await connectToDatabase();
    let recentFixedCamRecordings = await RecordRtsp.findAndCountAll({
      where: {
        active: false,
        user_id: user_id,
        ...(tags !== "All" && { tag_id: tags }), // Include `tag_id` only if `tags` is not "All"
      },
      order: [['start_time', 'DESC']], // Order by `start_time` in descending order to get the most recent records
      include: [
        {
          model: Camera,
          as: 'record_camera_tag',
          where: {
            ...(location !== "All" && { loc_id: location }), // Include `loc_id` condition only if `location` is not "All"
          },
          include: [
            {
              model: CustomerLocations,
            },
          ],
        },
        {
          model: RecordTag,
          as: 'record_tag',
        },
      ],
      limit: 10, // Fetch only the last 10 records
    });
     
    return {data: recentFixedCamRecordings.rows, count: recentFixedCamRecordings.count};
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

  getRecordedStreams: async(cust_id, from, to, location='All', zones="All", sortBy = 'ASC', pageNumber, pageSize, t)=> {
    const { LiveStreams, Zone, LiveStreamCameras, CustomerLocations } = await connectToDatabase();
    let where_obj = location === "All" ? {} : {loc_id: parseInt(location)}
    let status_obj = {stream_running : false}
    
    if(zones !== "All" & zones.length > 0){
      where_obj = {...where_obj, zone_name: zones}
    }
    
    let recordedStreams = await LiveStreams.findAndCountAll(
      {
        where: { cust_id: cust_id, ...status_obj,
        stream_start_time: {
          [Sequelize.Op.between]: [
            moment(from).startOf('day').toISOString(),
            moment(to).endOf('day').toISOString()
          ],
        },
      }, 
     order: [
        ['created_at', sortBy],
      ],
       attributes:["stream_id", "stream_name","stream_running", "s3_url", "created_at"],
      include: [{
        model: Zone,
        where: where_obj,
        as: "zone",
        include: [
          {
            model: LiveStreamCameras,
          },
          {
            model: CustomerLocations,
          }
        ]
      }], 
      limit: parseInt(pageSize),
      offset: parseInt(pageNumber * pageSize),
    },
      { transaction: t }
    );
    return {data: recordedStreams.rows, count: recordedStreams.count};
  },

  /* Service for creating sendbird group channel */
  createGroupChannel: async () => {
    const SEND_BIRD_API_URL = `https://api-${process.env.SEND_BIRD_APPLICATION_ID}.sendbird.com/v3/group_channels`;

    try {
      // Define the data for creating the group channel
      const requestData = {
        name: `group-${uuidv4()}`,
        is_public: true,
        // is_super: true
        // Add other properties as needed
      };
  
      // Set the authorization header with your Sendbird API token
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': process.env.SEND_BIRD_API_TOKEN,
        },
      };
  
      // Make a POST request to the Sendbird API endpoint
      const response = await axios.post(SEND_BIRD_API_URL, requestData, config);
  
      // Log the response data
      console.log('Group channel created:', response.data);
  
      return response.data;
    } catch (error) {
      // Handle errors
      console.error('Error creating group channel:', error);
      throw error;
    }
  },

  /* Service for deleting sendbird group channel */
  deleteGroupChannel: async (channel_url) => {
    const SEND_BIRD_API_URL = `https://api-${process.env.SEND_BIRD_APPLICATION_ID}.sendbird.com/v3/group_channels/${channel_url}`;
    try {
      // Set the authorization header with your Sendbird API token
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': process.env.SEND_BIRD_API_TOKEN,
        },
      };
      // Make a DELETE request to the Sendbird API endpoint
      const response = await axios.delete(SEND_BIRD_API_URL, config);
  
      // Log the response data
      console.log('Group channel deleted:', response.data);
  
      return response.data;
    } catch (error) {
      // Handle errors
      console.error('Error deleting group channel:', error);
      throw error;
    }
  }
};
