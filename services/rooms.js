const { Room, Camera } = require('../models/index');
const Sequelize = require('sequelize');
const { getAllCameraForRoom } = require('./cameras');
const _ = require('lodash');
module.exports = {
  /* Create new room */
  createRoom: async (roomObj) => {
    let roomCreated = await Room.create(roomObj);

    return roomCreated !== undefined ? roomCreated.toJSON() : null;
  },

  /* Edit room details */
  editRoom: async (user, params) => {
    let update = {
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP')
    };

    if (params?.room_name) {
      update.room_name = params.room_name;
    }
    if (params?.location) {
      update.location = params.location;
    }

    let updateRoomDetails = await Room.update(update, {
      where: { room_id: params.room_id }
    });

    if (updateRoomDetails) {
      updateRoomDetails = await Room.findOne({ where: { room_id: params.room_id } });
    }

    return updateRoomDetails.toJSON();
  },

  /* Delete Existing room */
  deleteRoom: async (roomId) => {
    let deletedRoom = await Room.destroy({
      where: { room_id: roomId }
    });

    return deletedRoom;
  },

  /* Fetch all the user's details */
  getAllRoomsDetails: async (userId) => {
    let rooms = await Room.findAll({ where: { user_id: userId } });

    let roomDetails = Promise.all(
      rooms.map(async (room) => {
        const roomId = room.dataValues.room_id;
        const roomDetails = room.dataValues;

        let camDetails = await getAllCameraForRoom(roomId);
        if (_.isEmpty(camDetails)) {
          camDetails = [];
        }

        return { ...roomDetails, camDetails };
      })
    );

    const finalRoomDetails = await roomDetails;

    return finalRoomDetails !== undefined ? finalRoomDetails : null;
  }
};
// rooms[0].room.dataValues
