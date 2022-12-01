const { Room, Camera } = require('../models/index');
const Sequelize = require('sequelize');
const { getAllCameraForRoom } = require('./cameras');
const _ = require('lodash');
const sequelize = require('../lib/database');
const { v4: uuidv4 } = require('uuid');
module.exports = {
  /* Create new room */
  createRoom: async (roomObj) => {
    roomObj.room_id = uuidv4();
    let roomCreated = await Room.create(roomObj);

    return roomCreated !== undefined ? roomCreated.toJSON() : null;
  },

  /* Edit room details */
  editRoom: async (user, params, t) => {
    let update = {
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP')
    };

    if (params?.room_name) {
      update.room_name = params.room_name;
    }
    if (params?.location) {
      update.location = params.location;
    }

    let updateRoomDetails = await Room.update(
      update,
      {
        where: { room_id: params.room_id }
      },
      { transaction: t }
    );

    if (updateRoomDetails) {
      updateRoomDetails = await Room.findOne(
        { where: { room_id: params.room_id } },
        { transaction: t }
      );
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

  /* Fetch all the room's details */
  getAllRoomsDetails: async (userId, filter) => {
    let { pageNumber = 0, pageSize = 10, roomsList = [], location = 'All', searchBy = '' } = filter;

    if (location == 'All') {
      location = '';
    }
    let rooms;
    if (roomsList?.length !== 0) {
      rooms = await Room.findAll({
        where: {
          user_id: userId,
          location: {
            [Sequelize.Op.substring]: location
          },
          room_name: {
            [Sequelize.Op.and]: { [Sequelize.Op.substring]: searchBy }
          },
          room_name: roomsList
        },
        include: [
          {
            model: Camera
          }
        ]
      });
    } else {
      rooms = await Room.findAll({
        where: {
          user_id: userId,
          location: {
            [Sequelize.Op.substring]: location
          },
          room_name: {
            [Sequelize.Op.substring]: searchBy
          }
        },
        include: [
          {
            model: Camera
          }
        ]
      });
    }

    let filteredrooms = [];

    rooms?.forEach((room) => {
      const cameras = [];
      room?.cameras?.forEach((cam) => {
        cam?.room_ids?.rooms?.forEach((room1) => {
          if (room1?.room_id === room?.room_id) {
            cameras?.push(cam?.dataValues);
          }
        });
      });

      filteredrooms?.push({ ...room?.dataValues, camDetails: cameras });
    });

    let count = filteredrooms.length;

    if (count > pageSize) {
      if (filteredrooms?.length > (pageNumber - 1) * pageSize + pageSize) {
        filteredrooms = filteredrooms?.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
      } else if (filteredrooms?.length > (pageNumber - 1) * pageSize) {
        filteredrooms = filteredrooms?.slice((pageNumber - 1) * pageSize);
      }
    }

    return { finalRoomDetails: filteredrooms, count };
  },

  // get all room's list for loggedin user
  getAllRoomsList: async (userId) => {
    let roomList = await Room.findAll({
      attributes: ['room_name', 'room_id', 'location'],
      where: { user_id: userId }
    });

    return roomList;
  }
};
