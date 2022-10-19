const roomServices = require('../services/rooms');

module.exports = {
  createRoom: async (req, res, next) => {
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id;
      const room = await roomServices.createRoom(params);

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

  editRoom: async (req, res, next) => {
    try {
      const params = req.body;
      const room = await roomServices.editRoom(req.user, params);

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
