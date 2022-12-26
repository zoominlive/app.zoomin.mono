const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const sequelize = require('../lib/database');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  /* Create new room */
  createRoom: async (roomObj, t) => {
    const { Room, CamerasInRooms } = await connectToDatabase();
    roomObj.room_id = uuidv4();
    let roomCreated = await Room.create(roomObj, { transaction: t });

    const camsToAdd = roomObj.cameras.map((cam) => {
      return {
        cam_id: cam.cam_id,
        room_id: roomCreated.room_id
      };
    });

    let camerasAssigned = await CamerasInRooms.bulkCreate(camsToAdd, { transaction: t });

    return roomCreated !== undefined ? roomCreated.toJSON() : null;
  },

  /* Edit room details */
  editRoom: async (user, params, t) => {
    const { Room, CamerasInRooms } = await connectToDatabase();
    let update = {};

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

    const camsToAdd = params.camerasToAdd.map((cam) => {
      return {
        cam_id: cam.cam_id,
        room_id: params.room_id
      };
    });

    const camsToRemove = params.cameras.map((cam) => {
      return cam.cam_id;
    });

    let camsRemoved = await CamerasInRooms.destroy(
      {
        where: { room_id: params.room_id, cam_id: camsToRemove },
        raw: true
      },
      { transaction: t }
    );

    let camsAdded = await CamerasInRooms.bulkCreate(camsToAdd, { transaction: t });

    return updateRoomDetails.toJSON();
  },

  /* Delete Existing room */
  deleteRoom: async (roomId, t) => {
    const { Room, CamerasInRooms } = await connectToDatabase();
    let camsDeleted = await CamerasInRooms.destroy(
      { where: { room_id: roomId }, raw: true },
      { transaction: t }
    );

    let deletedRoom = await Room.destroy(
      {
        where: { room_id: roomId }
      },
      { transaction: t }
    );

    return deletedRoom;
  },

  /* Fetch all the room's details */
  getAllRoomsDetails: async (userId, user, filter, t) => {
    const { Room, Camera } = await connectToDatabase();
    let { pageNumber = 0, pageSize = 10, roomsList = [], location = 'All', searchBy = '' } = filter;

    if (location == 'All') {
      location = '';
    }
    let rooms;
    if (user.role !== 'Admin') {
      if (roomsList?.length !== 0) {
        rooms = await Room.findAll(
          {
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
          },
          { transaction: t }
        );
      } else {
        rooms = await Room.findAll(
          {
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
          },
          { transaction: t }
        );
      }
    } else {
      if (roomsList?.length !== 0) {
        rooms = await Room.findAll(
          {
            where: {
              cust_id: user.cust_id,
              [Sequelize.Op.and]: [
                { location: user.location.accessable_locations },
                {
                  location: {
                    [Sequelize.Op.substring]: location
                  }
                }
              ],
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
          },
          { transaction: t }
        );
      } else {
        rooms = await Room.findAll(
          {
            where: {
              cust_id: user.cust_id,
              [Sequelize.Op.and]: [
                { location: user.location.accessable_locations },
                {
                  location: {
                    [Sequelize.Op.substring]: location
                  }
                }
              ],

              room_name: {
                [Sequelize.Op.substring]: searchBy
              }
            },
            include: [
              {
                model: Camera
              }
            ]
          },
          { transaction: t }
        );
      }
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
  getAllRoomsList: async (userId, user, t) => {
    const { Room } = await connectToDatabase();
    let roomList;
    if (user.role === 'Admin') {
      roomList = await Room.findAll(
        {
          attributes: ['room_name', 'room_id', 'location'],
          where: { cust_id: user.cust_id, location: user.location.accessable_locations }
        },
        { transaction: t }
      );
    } else {
      roomList = await Room.findAll(
        {
          attributes: ['room_name', 'room_id', 'location'],
          where: { user_id: userId }
        },
        { transaction: t }
      );
    }

    return roomList;
  },

  disableRoom: async (params, t) => {
    const { RoomsInChild } = await connectToDatabase();
    let update;
    if (params?.scheduled_disable_date == '' || params?.scheduled_disable_date == null) {
      update = { scheduled_enable_date: null, scheduled_disable_date: null, disabled: 'true' };
    } else {
      update = {
        scheduled_disable_date: params.scheduled_disable_date
      };
    }

    let disableRoom = await RoomsInChild.update(update, {
      where: {
        room_child_id: params.room_child_id
      },
      returning: true
    });

    return disableRoom;
  },
  enableRoom: async (params, t) => {
    const { RoomsInChild } = await connectToDatabase();
    let update;
    if (params?.scheduled_enable_date == '' || params?.scheduled_enable_date == null) {
      update = { scheduled_enable_date: null, scheduled_disable_date: null, disabled: 'false' };
    } else {
      update = { scheduled_enable_date: params.scheduled_enable_date };
    }

    let enableRoom = await RoomsInChild.update(
      update,
      {
        where: {
          room_child_id: params.room_child_id
        }
      },
      { transaction: t }
    );

    return enableRoom;
  }
};
