const connectToDatabase = require('../models/index');
const Sequelize = require('sequelize');
const _ = require('lodash');
const sequelize = require('../lib/database');
const { v4: uuidv4 } = require('uuid');
const CamerasInRooms = require('../models/cameras_assigned_to_rooms');

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
    if (params?.disabled) {
      update.location = params.disabled;
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

    let camsRemoved = await CamerasInRooms.destroy(
      {
        where: { room_id: params.room_id },
        raw: true
      },
      { transaction: t }
    );

    let camsAdded = await CamerasInRooms.bulkCreate(camsToAdd, { transaction: t });

    return updateRoomDetails.toJSON();
  },

  /* Delete Existing room */
  deleteRoom: async (roomId, t) => {
    const { Room, CamerasInRooms, RoomsInChild } = await connectToDatabase();
    let camsDeleted = await CamerasInRooms.destroy(
      { where: { room_id: roomId }, raw: true },
      { transaction: t }
    );

    let roomsDeleted = await RoomsInChild.destroy(
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
    let { pageNumber = 0, pageSize = 10, roomsList = [], location = 'All', searchBy = '', cust_id = null } = filter;

    if (pageNumber != 0) {
      pageNumber = pageNumber - 1;
    }

    if (location == 'All') {
      location = '';
    }
    let rooms;
    // if (user.role !== 'Admin') {
    //   if (roomsList?.length !== 0) {
    //     rooms = await Room.findAll(
    //       {
    //         where: {
    //           user_id: userId,
    //           location: {
    //             [Sequelize.Op.substring]: location
    //           },
    //           room_name: {
    //             [Sequelize.Op.and]: { [Sequelize.Op.substring]: searchBy }
    //           },
    //           room_name: roomsList
    //         },
    //         attributes: ['room_id', 'room_name', 'location'],
    //         include: [
    //           {
    //             model: CamerasInRooms,
    //             attributes: ['cam_room_id'],
    //             include: [
    //               {
    //                 model: Camera,
    //                 attributes: ['cam_id', 'cam_name', 'location', 'stream_uri', 'description']
    //               }
    //             ]
    //           }
    //         ]
    //       },
    //       { transaction: t }
    //     );
    //   } else {
    //     rooms = await Room.findAll(
    //       {
    //         where: {
    //           user_id: userId,
    //           location: {
    //             [Sequelize.Op.substring]: location
    //           },
    //           room_name: {
    //             [Sequelize.Op.substring]: searchBy
    //           }
    //         },
    //         attributes: ['room_id', 'room_name', 'location'],
    //         include: [
    //           {
    //             model: CamerasInRooms,
    //             attributes: ['cam_room_id'],
    //             include: [
    //               {
    //                 model: Camera,
    //                 attributes: ['cam_id', 'cam_name', 'location', 'stream_uri', 'description']
    //               }
    //             ]
    //           }
    //         ]
    //       },
    //       { transaction: t }
    //     );
    //   }
    // } else {
      if (roomsList?.length !== 0) {
        rooms = await Room.findAll(
          {
            where: {
              cust_id: user.cust_id || cust_id,
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
            attributes: ['room_id', 'room_name', 'location'],
            include: [
              {
                model: CamerasInRooms,
                attributes: ['cam_room_id'],
                include: [
                  {
                    model: Camera,
                    attributes: ['cam_id', 'cam_name', 'location', 'stream_uri', 'description']
                  }
                ]
              }
            ]
          },
          { transaction: t }
        );
      } else {
        rooms = await Room.findAll(
          {
            where: {
              cust_id: user.cust_id || cust_id,
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
            attributes: ['room_id', 'room_name', 'location'],
            include: [
              {
                model: CamerasInRooms,
                attributes: ['cam_room_id'],
                include: [
                  {
                    model: Camera,
                    attributes: ['cam_id', 'cam_name', 'location', 'stream_uri', 'description']
                  }
                ]
              }
            ]
          },
          { transaction: t }
        );
      }
    // }

    let count = rooms.length;

    if (count > pageSize) {
      if (count > pageNumber * pageSize + pageSize) {
        rooms = rooms.slice(pageNumber * pageSize,(pageNumber + 1) * pageSize);
      } else {
        rooms = rooms.slice(pageNumber * pageSize, pageNumber * pageSize + pageSize);
      }
    }

    rooms = rooms?.map((room) => {
      let cams = room.cameras_assigned_to_rooms.map((cam) => cam.camera);
      return {
        room_id: room.room_id,
        room_name: room.room_name,
        location: room.location,
        cameras: cams
      };
    });
  
    return { finalRoomDetails: rooms, count: count };
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

    let disableRoom = await RoomsInChild.update(
      update,
      {
        where: {
          room_child_id: params.room_child_id
        },
        returning: true
      },
      { transaction: t }
    );

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
