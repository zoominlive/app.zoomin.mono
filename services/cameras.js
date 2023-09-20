const connectToDatabase = require("../models/index");

const Sequelize = require("sequelize");

const sequelize = require("../lib/database");
const { isArray } = require("lodash");

module.exports = {
  /* Create new camera */
  createCamera: async (camObj, t) => {
    const { Camera } = await connectToDatabase();
    let camCreated = await Camera.create(camObj, { transaction: t });
    return camCreated;
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
  editCamera: async (camId, camObj, t) => {
    const { Camera } = await connectToDatabase();
    let update = {
      ...camObj,
    };
    let deletedCam = await Camera.update(
      update,
      {
        where: { cam_id: camId },
      },
      { transaction: t }
    );

    return deletedCam;
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
  getAllCameraForCustomerDashboard: async (custId, location = ["Select All"], t) => {
    const { Camera } = await connectToDatabase();
    let locs = []
    if(!location.includes("Select All")){
         locs = location
    }
  
    let cameras = await Camera.findAll(
      {
        where: {
          cust_id: custId,
          location: { [Sequelize.Op.in]: location }
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
        },
        { transaction: t }
      );
    }
    return { cams: cams.rows, count: cams.count };
  },

  getAllMountedCameraViewers: async (camIds, t) => {
    const { MountedCameraRecentViewers, Camera } = await connectToDatabase();

    // let recentViewers = await MountedCameraRecentViewers.findAll(
    //   { where: {function: "start"}, 
    //   include:[{
    //     model: Camera,
    //     where: { cam_id: { [Sequelize.Op.in]: camIds } }
    //   }], group: ["viewer_id"] },
    //   { transaction: t }
    // );

    // return recentViewers;
    // console.log('===camIds',camIds)
    // const recentViewers = await sequelize.query(`SELECT COUNT(DISTINCT sub.viewer_id) AS total_start_only_viewers
    // FROM (
    //     SELECT viewer_id
    //     FROM mounted_camera_recent_viewers
    //     WHERE 'function' = 'start' AND cam_id IN (:camIds)
    //     GROUP BY viewer_id
    // ) AS sub
    // WHERE NOT EXISTS (
    //     SELECT 1
    //     FROM mounted_camera_recent_viewers
    //     WHERE 'function' = 'stop' AND viewer_id = sub.viewer_id
    // );`, {
    //   replacements: { camIds },
    //   type: Sequelize.QueryTypes.SELECT
    // });
    //console.log('==camIds==',camIds, typeof camIds, typeof camIds[0], isArray(camIds));
//     let locs = []
//     if(!location.includes("Select All")){
//       locs = location
//  }

    const totalStartOnlyViewers = await MountedCameraRecentViewers.findAll({
      // include: [
      //   {
      //     model: Camera,
      //     as: 'camera',
      //     where: {
      //       cust_id: custId,
      //       location: locs
      //     },
      //     attributes: ['cam_id']
      //   }
      // ],
      attributes: [
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('viewer_id'))), 'total_start_only_viewers']
      ],
      where: {
          cam_id: { [Sequelize.Op.in]: camIds },
          function: 'start',
          viewer_id: {
              [Sequelize.Op.notIn]: MountedCameraRecentViewers.findAll({
                  attributes: ['viewer_id'],
                  where: {
                      function: 'stop'
                  }
              })
          }
      },
      raw: true,
  }, { transaction: t });
  
    return totalStartOnlyViewers[0]?.total_start_only_viewers
  },

};
