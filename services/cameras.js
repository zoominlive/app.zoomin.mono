const connectToDatabase = require("../models/index");

const Sequelize = require("sequelize");
const jwt = require('jsonwebtoken');
const sequelize = require("../lib/database");
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const Camera = require("../models/camera");
const Zone = require("../models/zone");
const CamerasInZones = require("../models/cameras_assigned_to_zones");

module.exports = {
  /* Create new camera */
  createCamera: async (camObj, zonesToAdd, t) => {
    const { Camera } = await connectToDatabase();
    let camCreated = await Camera.create(camObj, { transaction: t });
    const mappedData = zonesToAdd.map((zone) => {
      return {
        zone_id: zone.zone_id,
        cam_id: camCreated.cam_id,
      };
    });
    await CamerasInZones.bulkCreate(mappedData, {
      transaction: t,
    });

    return camCreated !== undefined ? camCreated.toJSON() : null;
  },

  validateCamera: async (cam_id, userCustId) => {
    try {
      const camera = await Camera.findOne({
        where: { cam_id: cam_id },
        raw: true,
        plain: true,
      });
      if (!camera) {
        return { valid: false, message: "Camera:" + cam_id + " not found." };
      }
      if (camera.cust_id !== userCustId) {
        return {
          valid: false,
          message: "Unauthorized access to camera:" + cam_id,
        };
      }
      return { valid: true, message: "Camera is valid." };
    } catch (error) {
      console.error("Error validating camera:", error);
      return { valid: false, message: "Error validating camera." };
    }
  },

  /* Delete Existing camera */
  deleteCamera: async (camId, t) => {
    const { Camera, CamerasInZones } = await connectToDatabase();
    let camsDeleted = await CamerasInZones.destroy(
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
    if (params !== null && params !== undefined && params !== "") {
      const zonesToAdd = params.map((zone) => {
        return {
          zone_id: zone.zone_id || zone.zone.zone_id,
          cam_id: camId,
        };
      });
      await CamerasInZones.destroy(
        {
          where: { cam_id: camId },
          raw: true,
        },
        { transaction: t }
      );

      await CamerasInZones.bulkCreate(zonesToAdd, {
        transaction: t,
      });
    }
    return updatedCam;
  },

  /* Fetch all the camera's details for given zone */
  getAllCameraForZone: async (zoneId, t) => {
    const { Camera } = await connectToDatabase();
    const query = `SELECT * FROM camera WHERE room_ids LIKE '%${zoneId}%'  `;
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
          loc_id: { [Sequelize.Op.in]: location },
        },
      },
      { transaction: t }
    );

    return cameras !== undefined ? cameras : null;
  },

  /* Fetch all the camera's details for given customer */
  getAllCameraForCustomer: async (custId, user, filter, t) => {
    const { Camera, CustomerLocations, CamerasInZones, Zone } =
      await connectToDatabase();

    let {
      pageNumber = 0,
      pageSize = 10,
      searchBy = "",
      location = [],
      cust_id = null,
    } = filter;

    // Determine location condition
    let locationCondition = {};
    if (Array.isArray(location) && !location.includes("All")) {
      if (location.length > 0) {
        locationCondition = { loc_id: { [Sequelize.Op.in]: location } };
      } else if (!cust_id) {
        if (user?.locations?.length) {
          locationCondition = {
            loc_id: {
              [Sequelize.Op.in]: user.locations.map((item) => item.loc_id),
            },
          };
        }
      } else {
        const availableLocations = await CustomerLocations.findAll({
          where: { cust_id },
          attributes: ["loc_id"],
          raw: true,
        });
    
        const locs = availableLocations.map((i) => i.loc_id);
        if (locs.length > 0) {
          locationCondition = { loc_id: { [Sequelize.Op.in]: locs } };
        }
      }
    }
    console.log('locationCondition==>', locationCondition);
    
    // Construct the query object
    const query = {
      where: {
        cust_id: custId || cust_id,
        ...locationCondition,
        [Sequelize.Op.or]: [
          { cam_name: { [Sequelize.Op.like]: `%${searchBy}%` } },
          { description: { [Sequelize.Op.like]: `%${searchBy}%` } },
        ],
      },
      include: [
        {
          model: CamerasInZones,
          attributes: ["cam_zone_id"],
          include: [
            {
              model: Zone,
              attributes: ["zone_id", "zone_name", "loc_id"],
            },
          ],
        },
        {
          model: CustomerLocations,
          attributes: ["loc_id", "loc_name"],
        },
      ],
      distinct: true,
    };

    // Apply pagination if present
    if (pageNumber !== undefined && pageSize !== undefined) {
      query.limit = parseInt(pageSize);
      query.offset = parseInt(pageNumber * pageSize);
    }

    const cams = await Camera.findAndCountAll(query, { transaction: t });
    
    return { cams: cams.rows, count: cams.count };
  },

  /* Fetch all the camera's details for transcoder */
  getAllCameraForTranscoder: async (cust_ids, loc_ids) => {
    const { Camera } = await connectToDatabase();

    let cams;

    cams = await Camera.findAndCountAll({
      where: {
        cust_id: cust_ids,
        loc_id: loc_ids,
      },
    });
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
    let { sid, hlsStreamUri, userId, transcoder_endpoint } = filter;
    console.log('transcoder_endpoint==>', transcoder_endpoint);
    const uuid = uuidv4();
    const secKeyToken = jwt.sign({ user_id: userId, cam_id: sid, uuid: uuid }, process.env.STREAM_URL_SECRET_KEY, {expiresIn: '12h'});
    
    const baseUrl =
      "https://wvgfhd64eh.execute-api.us-east-1.amazonaws.com/default/thumbnail";
    const hlsUrl = encodeURIComponent(
      `${transcoder_endpoint}${hlsStreamUri}?seckey=${secKeyToken}`
    );
    // const hlsUrl = 'https://thirdstreet.zoominlive.com/stream/fb05fb2c-41a8-4c87-a464-489b79ef915a/index.m3u8?uid=c6f01497-7470-40f7-bbbe-c1c37553158e&sid=211&uuid=2066df71-8e59-47a4-a8e3-8ef0f6b096c5'
    const thumbRes = await axios.get(baseUrl, {
      params: {
        cid: custId,
        hlsUrl: hlsUrl,
        sid: sid,
        uuid: uuid,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": "fyAErotfBna2ONZSTtGlb4tcaflUeLWR1YWf7jXu",
      },
    });
    return thumbRes.data;
  },
};
