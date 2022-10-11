const { Camera, CustomerLocations } = require('../models/index');
const Sequelize = require('sequelize');
const { startEncodingStream } = require('../lib/rtsp-stream');

module.exports = {
  /* Create new room */
  createCamera: async (camObj) => {
    // const location_id = await CustomerLocations.findOne({ where: { loc_name: camObj.location } });

    // camObj.location_id = location_id;

    let camCreated = await Camera.create(camObj);
    return camCreated;
    // return camCreated !== undefined ? camCreated.toJSON() : null;
  },

  /* Delete Existing camera */
  deleteCamera: async (camId) => {
    let deletedCam = await Camera.destroy({
      where: { cam_id: camId }
    });

    return deletedCam;
  },

  /* Fetch all the user's details */
  getAllCamera: async (userId) => {
    let rooms = await Room.findAll({ where: { user_id: userId } });
    return rooms !== undefined ? rooms : null;
  },

  /* Fetch all the user's details */
  getAllCameraForRoom: async (roomId) => {
    let cameras = await Camera.findAll({ where: { room_id: roomId } });
    return cameras !== undefined ? cameras : null;
  }
};
