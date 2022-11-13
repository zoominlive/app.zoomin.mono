const { Camera, Customers } = require('../models/index');
const Sequelize = require('sequelize');

const sequelize = require('../lib/database');

module.exports = {
  /* Create new camera */
  createCamera: async (camObj) => {
    let camCreated = await Camera.create(camObj);
    return camCreated;
  },

  /* Delete Existing camera */
  deleteCamera: async (camId) => {
    let deletedCam = await Camera.destroy({
      where: { cam_id: camId }
    });

    return deletedCam;
  },

  /* Edit Existing camera */
  editCamera: async (camId, camObj) => {
    let update = {
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      ...camObj
    };
    let deletedCam = await Camera.update(update, {
      where: { cam_id: camId }
    });

    return deletedCam;
  },

  /* Fetch all the camera's details for given room */
  getAllCameraForRoom: async (roomId) => {
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
  getAllCameraForCustomerDashboard: async (custId) => {
    let cameras = await Camera.findAll({
      where: {
        cust_id: custId
      }
    });

    return cameras !== undefined ? cameras : null;
  },

  /* Fetch all the camera's details for given customer */
  getAllCameraForCustomer: async (custId, filter) => {
    let { pageNumber = 0, pageSize = 10, searchBy = '', location = 'All' } = filter;

    let cams;
    let count = 0;
    if (location === 'All') {
      location = '';
    }
    count = await Camera.count({
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
    });

    cams = await Camera.findAll({
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
    });

    return { cams, count };
  }
};
