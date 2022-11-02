const { Camera } = require('../models/index');
const Sequelize = require('sequelize');

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
    let cameras = await Camera.findAll({ where: { room_id: roomId } });
    return cameras !== undefined ? cameras : null;
  },

  /* Fetch all the camera's details for given customer */
  getAllCameraForCustomer: async (custId) => {
    let cameras = await Camera.findAll({ raw: true, where: { cust_id: custId } });
    return cameras !== undefined ? cameras : null;
  }
};
