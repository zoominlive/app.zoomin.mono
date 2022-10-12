const { Room, Camera } = require('../models/index');
const Sequelize = require('sequelize');
const { getAllCameraForRoom } = require('./cameras');
const _ = require('lodash');
const sequelize = require('../lib/database');
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
  getAllRoomsDetails: async (userId, filter) => {
    let { pageNumber = 0, pageSize = 10, searchBy = '', location = 'All' } = filter;

    let rooms;
    let count;

    if (location === 'All') {
      count = (
        await sequelize.query(
          `SELECT DISTINCT COUNT(room_id) AS count FROM room  WHERE user_id = ${userId}  AND (room_name LIKE '%${searchBy}%')`,
          {
            model: Room,
            mapToModel: true
          },
          {
            model: Camera,
            mapToModel: true
          },
          { type: Sequelize.QueryTypes.SELECT }
        )
      )[0].dataValues.count;

      rooms = await sequelize.query(
        `SELECT * FROM room  WHERE user_id = ${userId}  AND (room_name LIKE '%${searchBy}%' ) LIMIT ${pageSize} OFFSET ${
          pageNumber * pageSize
        }`,
        { type: Sequelize.QueryTypes.SELECT },
        {
          model: Room,
          mapToModel: true
        },
        {
          model: Camera,
          mapToModel: true
        }
      );
    } else {
      count = (
        await sequelize.query(
          `SELECT DISTINCT COUNT(room_id) AS count FROM room  WHERE user_id = ${userId} AND room.location LIKE '%${location}%' AND (room_name LIKE '%${searchBy}%')`,
          {
            model: Room,
            mapToModel: true
          },
          {
            model: Camera,
            mapToModel: true
          },
          { type: Sequelize.QueryTypes.SELECT }
        )
      )[0].dataValues.count;

      rooms = await sequelize.query(
        `SELECT * FROM room  WHERE room.user_id = ${userId} AND location LIKE '%${location}%' AND (room_name LIKE '%${searchBy}%') LIMIT ${pageSize} OFFSET ${
          pageNumber * pageSize
        }`,
        {
          model: Room,
          mapToModel: true
        },
        {
          model: Camera,
          mapToModel: true
        },
        { type: Sequelize.QueryTypes.SELECT }
      );
    }

    let roomDetails = Promise.all(
      rooms.map(async (room) => {
        const roomId = room.room_id;

        let camDetails = await getAllCameraForRoom(roomId);
        if (_.isEmpty(camDetails)) {
          camDetails = [];
        }

        return { ...room, camDetails };
      })
    );

    const finalRoomDetails = await roomDetails;

    return { finalRoomDetails, count };
  },

  getAllRoomsList: async (userId) => {
    let roomList = await Room.findAll({
      attributes: ['room_name', 'room_id'],
      where: { user_id: userId }
    });

    return roomList;
  }
};
