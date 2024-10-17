const connectToDatabase = require("../models/index");

const Sequelize = require("sequelize");

const sequelize = require("../lib/database");
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Camera = require("../models/camera");
const Room = require("../models/room");
const CamerasInRooms = require("../models/cameras_assigned_to_rooms");

module.exports = {
  /* Create new camera */
  createCamera: async (camObj, roomsToAdd, t) => {
    const { Camera } = await connectToDatabase();
    let camCreated = await Camera.create(camObj, { transaction: t });
    const mappedData = roomsToAdd.map((room) => {
      return {
        room_id: room.room_id,
        cam_id: camCreated.cam_id,
      };
    });
    await CamerasInRooms.bulkCreate(mappedData, {
      transaction: t,
    });

    return camCreated !== undefined ? camCreated.toJSON() : null;
  },

  validateCamera: async (cam_id, userCustId) => {
    try {
      const camera = await Camera.findOne({where: {cam_id: cam_id}, raw: true, plain: true});
      if (!camera) {
        return { valid: false, message: 'Camera:'+ cam_id +' not found.' };
      }
      if (camera.cust_id !== userCustId) {
        return { valid: false, message: 'Unauthorized access to camera:'+ cam_id};
      }
      return { valid: true, message: 'Camera is valid.' };
    } catch (error) {
      console.error('Error validating camera:', error);
      return { valid: false, message: 'Error validating camera.' };
    }
  },

  /* Delete Existing camera */
  deleteCamera: async (camId, t) => {
    const { Camera, CamerasInRooms } = await connectToDatabase();
    let camsDeleted = await CamerasInRooms.destroy(
      { where: { cam_id: camId }, raw: true },
      { transaction: t }
    );
    let deletedCam = await Camera.destroy(
      {
        where: { cam_id: camId },
      },
      { transaction: t }
    );

    return deletedCam;
  },

  /* Edit Existing camera */
  editCamera: async (camId, camObj, params, t) => {
    const { Camera } = await connectToDatabase();
    let update = {
      ...camObj,
    };
    let updatedCam = await Camera.update(
      update,
      {
        where: { cam_id: camId },
      },
      { transaction: t }
    );
    const roomsToAdd = params.map((room) => {
      return {
        room_id: room.room_id || room.room.room_id,
        cam_id: camId,
      };
    });
    await CamerasInRooms.destroy(
      {
        where: { cam_id: camId },
        raw: true,
      },
      { transaction: t }
    );
    
    await CamerasInRooms.bulkCreate(roomsToAdd, {
      transaction: t,
    });
    return updatedCam;
  },

  /* Fetch all the camera's details for given room */
  getAllCameraForRoom: async (roomId, t) => {
    const { Camera } = await connectToDatabase();
    const query = `SELECT * FROM camera WHERE room_ids LIKE '%${roomId}%'  `;
    let cameras = await sequelize.query(
      query,
      { type: Sequelize.QueryTypes.SELECT },
      {
        model: Camera,
        mapToModel: true,
      }
    );
    return cameras !== undefined ? cameras : null;
  },

  /* Fetch all the camera's details for given customer */
  getAllCameraForCustomerDashboard: async (
    custId,
    location = ["Select All"],
    t
  ) => {
    const { Camera } = await connectToDatabase();
    let locs = [];
    if (!location.includes("Select All")) {
      locs = location;
    }

    let cameras = await Camera.findAll(
      {
        where: {
          cust_id: custId,
          location: { [Sequelize.Op.in]: location },
        },
      },
      { transaction: t }
    );

    return cameras !== undefined ? cameras : null;
  },

  /* Fetch all the camera's details for given customer */
  getAllCameraForCustomer: async (custId, user, filter, t) => {
    const { Camera, CustomerLocations } = await connectToDatabase();
    let {
      pageNumber,
      pageSize,
      searchBy = "",
      location = "All",
      cust_id = null,
    } = filter;

    let cams;
    if (location === "All") {
      location = "";
    }
    let loc_obj = {};
    if (!cust_id) {
      loc_obj = { location: user.location.accessable_locations };
    } else {
      let availableLocations = await CustomerLocations.findAll({
        where: { cust_id: cust_id },
        raw: true,
      });
      let locs = availableLocations.flatMap((i) => i.loc_name);
      loc_obj = { location: locs };
    }

    if (filter.pageNumber && filter.pageSize) {
      cams = await Camera.findAndCountAll(
        {
          limit: parseInt(pageSize),
          offset: parseInt(pageNumber * pageSize),
          where: {
            cust_id: custId || cust_id,
            // location: {
            //   [Sequelize.Op.like]: `%${location}`
            // },
            [Sequelize.Op.and]: [
              // { location: user.location.accessable_locations },
              loc_obj,
              {
                location: {
                  [Sequelize.Op.like]: `%${location}`,
                },
              },
            ],
            [Sequelize.Op.or]: [
              {
                cam_name: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
              {
                description: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
            ],
          },
          include: [
            {
              model: CamerasInRooms,
              attributes: ["cam_room_id"],
              include: [
                {
                  model: Room,
                  attributes: [
                    "room_id",
                    "room_name",
                    "location"
                  ],
                },
              ],
            },
          ]
        },
        { transaction: t }
      );
    } else {
      cams = await Camera.findAndCountAll(
        {
          where: {
            cust_id: custId || cust_id,
            location: {
              [Sequelize.Op.like]: `%${location}`,
            },
            [Sequelize.Op.or]: [
              {
                cam_name: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
              {
                description: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
            ],
          },
          include: [
            {
              model: CamerasInRooms,
              attributes: ["cam_room_id"],
              include: [
                {
                  model: Room,
                  attributes: [
                    "room_id",
                    "room_name",
                    "location"
                  ],
                },
              ],
            },
          ]
        },
        { transaction: t }
      );
    }
    return { cams: cams.rows, count: cams.count };
  },

  /* Fetch all the camera's details for transcoder */
  getAllCameraForTranscoder: async (cust_ids) => {
    const { Camera } = await connectToDatabase();

    let cams;

    cams = await Camera.findAndCountAll(
      {
        where: {
          cust_id: cust_ids,
        },
      }
    );
    return { cams: cams.rows, count: cams.count };
  },
  
  getAllMountedCameraViewers: async (camIds, t) => {
    // .query(
    //   'SELECT recent_user_id, COUNT(DISTINCT sub.viewer_id) AS total_start_only_viewers FROM (SELECT viewer_id FROM mounted_camera_recent_viewers WHERE `function` = "start" AND cam_id IN (:camIds) GROUP BY viewer_id) AS sub WHERE NOT EXISTS (SELECT 1 FROM mounted_camera_recent_viewers WHERE `function` = "stop" AND viewer_id = sub.viewer_id)',
    //   { replacements: { camIds }, type: sequelize.QueryTypes.SELECT }
    // )
    // let result = await sequelize.query(
    //   'SELECT recent_user_id, COUNT(DISTINCT sub.viewer_id) AS total_start_only_viewers FROM (SELECT recent_user_id,viewer_id FROM mounted_camera_recent_viewers WHERE `function` = "start" AND cam_id IN (:camIds) AND DATE(requested_at) = CURDATE() GROUP BY recent_user_id) AS sub WHERE NOT EXISTS (SELECT 1 FROM mounted_camera_recent_viewers WHERE `function` = "stop" AND viewer_id = sub.viewer_id AND DATE(requested_at) = CURDATE())',
    //   { replacements: { camIds }, type: sequelize.QueryTypes.SELECT }
    // );
    let result = await sequelize.query(
      'SELECT recent_user_id, viewer_id, COUNT(DISTINCT viewer_id) AS total_start_only_viewers, COUNT(*) OVER () AS total_recent_viewers FROM mounted_camera_recent_viewers WHERE `function` = "start" AND cam_id IN (:camIds) AND DATE(requested_at) = CURDATE() AND viewer_id NOT IN (SELECT viewer_id FROM mounted_camera_recent_viewers WHERE `function` = "stop" AND DATE(requested_at) = CURDATE()) GROUP BY recent_user_id',
      { replacements: { camIds }, type: sequelize.QueryTypes.SELECT }
    );

    return result[0]?.total_recent_viewers;
  },

  /* Get thumbnail url */
  getThumbnailUrl: async (custId, token, filter) => {
    let {
      sid,
      hlsStreamUri,
      userId
    } = filter;
    const uuid = uuidv4();
    const baseUrl = "https://wvgfhd64eh.execute-api.us-east-1.amazonaws.com/default/thumbnail"
    const hlsUrl = encodeURIComponent(`https://thirdstreet.zoominlive.com${hlsStreamUri}?uid=${userId}&sid=${sid}&uuid=${uuid}`)
    // const hlsUrl = 'https://thirdstreet.zoominlive.com/stream/fb05fb2c-41a8-4c87-a464-489b79ef915a/index.m3u8?uid=c6f01497-7470-40f7-bbbe-c1c37553158e&sid=211&uuid=2066df71-8e59-47a4-a8e3-8ef0f6b096c5'
    const thumbRes = await axios.get(baseUrl, {
      params: {
        cid: custId,
        hlsUrl: hlsUrl,
        sid: sid,
        uuid: uuid
      },
      headers: {
        'Authorization': `Bearer ${token}`, 
        'x-api-key': 'fyAErotfBna2ONZSTtGlb4tcaflUeLWR1YWf7jXu'
      }
    });
    return thumbRes.data;
  }
};
