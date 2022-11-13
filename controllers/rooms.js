const roomServices = require('../services/rooms');
const cameraServices = require('../services/cameras');
const _ = require('lodash');
module.exports = {
  // create new room
  createRoom: async (req, res, next) => {
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id;
      const room = await roomServices.createRoom(params);

      params?.cameras?.forEach(async (camera) => {
        let rooms = [];

        if (!_.isEmpty(camera.room_ids)) {
          rooms = camera.room_ids.rooms;
        }
        rooms.push({ room_name: room.room_name, room_id: room.room_id });

        await cameraServices.editCamera(camera.cam_id, { room_ids: { rooms: rooms } });
      });

      res.status(201).json({
        IsSuccess: true,
        Data: room,
        Message: 'New Room created'
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  // edit existing room
  editRoom: async (req, res, next) => {
    try {
      const params = req.body;
      const room = await roomServices.editRoom(req.user, params);

      params?.cameras?.forEach(async (camera) => {
        let rooms = camera.room_ids.rooms.filter((room) => room.room_id !== params.room_id);
        await cameraServices.editCamera(camera.cam_id, { room_ids: { rooms: rooms } });
      });

      params?.camerasToAdd?.forEach(async (cam) => {
        let rooms = cam?.room_ids?.rooms;
        rooms?.push({ room_id: params.room_id, room_name: room?.room_name });
        await cameraServices.editCamera(cam.cam_id, { room_ids: { rooms: rooms } });
      });

      res.status(200).json({
        IsSuccess: true,
        Data: room,
        Message: 'Room details Updated'
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  // delete existing room
  deleteRoom: async (req, res, next) => {
    try {
      const params = req.body;
      const room = await roomServices.deleteRoom(params.room_id);

      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: 'Room Deleted'
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  // get room details for room list page
  getAllRoomsDetails: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        roomsList: req.query?.rooms,
        location: req.query?.location,
        searchBy: req.query?.searchBy.replace(/'/g, "\\'")
      };
      const rooms = await roomServices.getAllRoomsDetails(req.user.user_id, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: rooms,
        Message: `All the room's details for user:${req.user.first_name}`
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  // get room's list for loggedin user
  getAllRoomsList: async (req, res, next) => {
    try {
      const rooms = await roomServices.getAllRoomsList(req.user.user_id);

      res.status(200).json({
        IsSuccess: true,
        Data: rooms,
        Message: `All the room's details for user:${req.user.first_name}`
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  }
};
