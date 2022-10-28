const { Camera, Room } = require('../models/index');

module.exports = {
  /* Create new camera */
  getAllCamForLocation: async (userId, location) => {
    let rooms = await Room.findAll({ raw: true, where: { user_id: userId, location: location } });

    let cameras = Promise.all(
      rooms.map(async (room) => {
        const cams = await Camera.findAll({ raw: true, where: { room_id: room.room_id } });

        return { ...room, cameras: cams };
      })
    );
    const cameraDetails = await cameras;
    return cameraDetails;
  }
};
