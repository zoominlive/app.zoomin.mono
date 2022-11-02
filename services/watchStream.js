const { Camera, Room, RecentViewers, Customers } = require('../models/index');
const moment = require('moment');
const Sequelize = require('sequelize');

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
  },

  addRecentViewers: async (params) => {
    let recentViewerObj = { ...params, requested_at: Sequelize.literal('CURRENT_TIMESTAMP') };
    let recentViewer = await RecentViewers.create(recentViewerObj);

    return recentViewer;
  },
  getRecentViewers: async () => {
    let twoHoursBefore = new Date();
    twoHoursBefore.setHours(twoHoursBefore.getHours() - 2);

    const currentTime = new Date();

    let recentViewers = await RecentViewers.findAll({
      raw: true,
      where: {
        requested_at: {
          [Sequelize.Op.between]: [twoHoursBefore.toISOString(), currentTime.toISOString()]
        }
      }
    });

    return recentViewers;
  }
};
