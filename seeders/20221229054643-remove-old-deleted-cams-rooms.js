'use strict';
const connectToDatabase = require('../models/index');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const Models = await connectToDatabase();
    const data = await Models.CamerasInRooms.findAll({
      include: [
        {
          model: Models.Camera
        },
        {
          model: Models.Room
        }
      ]
    });

    await Promise.all(
      data.map(async (cam_room) => {
        if (cam_room.room == null || cam_room.camera == null) {
          await Models.CamerasInRooms.destroy({
            where: {
              cam_room_id: cam_room.cam_room_id
            }
          });
        }
      })
    );

    const data1 = await Models.RoomsInChild.findAll({
      include: [
        {
          model: Models.Child
        },
        {
          model: Models.Room,
          as: 'room'
        }
      ]
    });

    await Promise.all(
      data1.map(async (room_child) => {
        if (room_child.room == null || room_child.child == null) {
          await Models.RoomsInChild.destroy({
            where: {
              room_child_id: room_child.room_child_id
            }
          });
        }
      })
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
