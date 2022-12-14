const connectToDatabase = require('../models/index');

const Sequelize = require('sequelize');

const sequelize = require('../lib/database');

module.exports = {
  /* Create new camera */
  createCamera: async (camObj, t) => {
    const { Camera } = await connectToDatabase();
    let camCreated = await Camera.create(camObj, { transaction: t });
    return camCreated;
  },

  /* Delete Existing camera */
  deleteCamera: async (camId, t) => {
    const { Camera } = await connectToDatabase();
    let deletedCam = await Camera.destroy(
      {
        where: { cam_id: camId }
      },
      { transaction: t }
    );

    return deletedCam;
  },

  /* Edit Existing camera */
  editCamera: async (camId, camObj, t) => {
    const { Camera } = await connectToDatabase();
    let update = {
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      ...camObj
    };
    let deletedCam = await Camera.update(
      update,
      {
        where: { cam_id: camId }
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
        mapToModel: true
      }
    );
    return cameras !== undefined ? cameras : null;
  },

  /* Fetch all the camera's details for given customer */
  getAllCameraForCustomerDashboard: async (custId, t) => {
    const { Camera } = await connectToDatabase();
    let cameras = await Camera.findAll(
      {
        where: {
          cust_id: custId
        }
      },
      { transaction: t }
    );

    return cameras !== undefined ? cameras : null;
  },

  /* Fetch all the camera's details for given customer */
  getAllCameraForCustomer: async (custId, filter, t) => {
    const { Camera } = await connectToDatabase();
    let { pageNumber, pageSize, searchBy = '', location = 'All' } = filter;

    let cams;
    let count = 0;
    if (location === 'All') {
      location = '';
    }

    count = await Camera.count(
      {
        where: {
          cust_id: custId,
          location: {
            [Sequelize.Op.like]: `%${location}`
          },
          [Sequelize.Op.or]: [
            {
              cam_name: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            },
            {
              description: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            }
          ]
        }
      },
      { transaction: t }
    );

    if (!pageNumber || !pageSize) {
      pageSize = count;
      pageNumber = 0;
    }
    cams = await Camera.findAll(
      {
        limit: parseInt(pageSize),
        offset: parseInt(pageNumber * pageSize),
        where: {
          cust_id: custId,
          location: {
            [Sequelize.Op.like]: `%${location}`
          },
          [Sequelize.Op.or]: [
            {
              cam_name: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            },
            {
              description: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            }
          ]
        }
      },
      { transaction: t }
    );

    return { cams, count };
  }
};
