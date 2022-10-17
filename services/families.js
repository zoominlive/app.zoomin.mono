const { Family, Camera } = require('../models/index');
const Sequelize = require('sequelize');
const { getAllCameraForRoom } = require('./cameras');
const _ = require('lodash');
const sequelize = require('../lib/database');
module.exports = {
  /* Create new room */
  createFamily: async (familyObj) => {
    let familyCreated = await Family.create(familyObj);

    return familyCreated !== undefined ? familyCreated.toJSON() : null;
  },

  generateNewFamilyId: async (userId) => {
    let newFamilyId = await Family.findOne({
      where: { user_id: userId },
      order: [['family_id', 'DESC']]
    });

    if (newFamilyId === null) {
      return 1;
    } else {
      return newFamilyId.family_id + 1;
    }
  },

  /* Edit room details */
  editFamily: async (params) => {
    const familyObj = _.omit(params, ['family_member_id']);
    let update = {
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
      ...familyObj
    };

    let updateFamilyDetails = await Family.update(update, {
      where: { family_member_id: params.family_member_id }
    });

    if (updateFamilyDetails) {
      updateFamilyDetails = await Family.findOne({
        where: { family_member_id: params.family_member_id }
      });
    }

    return updateFamilyDetails;
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
    let { pageNumber = 0, pageSize = 10, roomsList = [], location = 'All', searchBy = '' } = filter;

    let rooms;
    let count;
    let countQuery;
    let mainQuery;

    if (location === 'All') {
      location = '';
    }

    if (roomsList.length === 0) {
      countQuery = `SELECT DISTINCT COUNT(room_id) AS count FROM room  WHERE user_id = ${userId} AND location LIKE '%${location}%' AND room_name LIKE '%${searchBy}%'`;
      mainQuery = `SELECT * FROM room  WHERE user_id = ${userId} AND location LIKE '%${location}%' AND room_name LIKE '%${searchBy}%' LIMIT ${pageSize} OFFSET ${
        pageNumber * pageSize
      } `;
    } else {
      let roomsToSearch = '';
      roomsList.forEach(
        (room) => (roomsToSearch = roomsToSearch + `room_name LIKE '%${room.room_name}%' OR `)
      );
      roomsToSearch = roomsToSearch.slice(0, -3);
      countQuery = `SELECT DISTINCT COUNT(room_id) AS count FROM room  WHERE user_id = ${userId} AND location LIKE '%${location}%' AND (${roomsToSearch}) AND room_name LIKE '%${searchBy}%'`;
      mainQuery = `SELECT * FROM room  WHERE user_id = ${userId} AND location LIKE '%${location}%' AND (${roomsToSearch}) AND room_name LIKE '%${searchBy}%' LIMIT ${pageSize} OFFSET ${
        pageNumber * pageSize
      }`;
    }
    count = (
      await sequelize.query(
        countQuery,
        {
          model: Room,
          mapToModel: true
        },
        { type: Sequelize.QueryTypes.SELECT }
      )
    )[0].dataValues.count;

    rooms = await sequelize.query(
      mainQuery,
      { type: Sequelize.QueryTypes.SELECT },
      {
        model: Room,
        mapToModel: true
      }
    );

    let roomDetails = Promise.all(
      rooms.map(async (room) => {
        let roomId;
        let roomDetails = room;
        if (room.dataValues) {
          roomId = room.dataValues.room_id;
        } else {
          roomId = room.room_id;
        }

        if (room.dataValues) {
          roomDetails = room.dataValues;
        }

        let camDetails = await getAllCameraForRoom(roomId);
        if (_.isEmpty(camDetails)) {
          camDetails = [];
        }

        return { ...roomDetails, camDetails };
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
