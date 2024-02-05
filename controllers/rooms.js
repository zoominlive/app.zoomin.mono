const roomServices = require('../services/rooms');
const cameraServices = require('../services/cameras');
const logServices = require('../services/logs');
const CONSTANTS = require('../lib/constants');
const _ = require('lodash');
const sequelize = require('../lib/database');
const customerServices = require('../services/customers');

module.exports = {
  // create new room
  createRoom: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      const room = await roomServices.createRoom(params, t);

      if (room) {
        await customerServices.editCustomer(
          params.cust_id,
          {max_stream_live_license_room: params.max_stream_live_license_room},
          t
        );
      }
      params?.cameras?.forEach(async (camera) => {
        let rooms = [];

        if (!_.isEmpty(camera.room_ids)) {
          rooms = camera.room_ids.rooms;
        }
        rooms.push({ room_name: room.room_name, room_id: room.room_id });

        await cameraServices.editCamera(camera.cam_id, { room_ids: { rooms: rooms } }, t);
      });

      await t.commit();
      res.status(201).json({
        IsSuccess: true,
        Data: room,
        Message: CONSTANTS.ROOM_CREATED
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Room',
        function_type: 'Add',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  // edit existing room
  editRoom: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const room = await roomServices.editRoom(req.user, params, t);

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: room,
        Message: CONSTANTS.ROOM_UPDATED
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Room',
        function_type: 'Edit',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  // delete existing room
  deleteRoom: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const { custId, max_stream_live_license_room } = params;
      const room = await roomServices.deleteRoom(params.room_id, t);
      if(room && custId && max_stream_live_license_room){
        await customerServices.editCustomer(
          custId,
          {max_stream_live_license_room: max_stream_live_license_room},
          t
          );
        }
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.ROOM_DELETED
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Room',
        function_type: 'Delete',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  // get room details for room list page
  getAllRoomsDetails: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: parseInt(req.query?.pageNumber) + 1,
        pageSize: parseInt(req.query?.pageSize),
        roomsList: req.query?.rooms,
        location: req.query?.location,
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'"),
        cust_id: req.query?.cust_id
      };
      
      const rooms = await roomServices.getAllRoomsDetails(req.user.user_id, req.user, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: rooms,
        Message: CONSTANTS.ROOM_DETAILS + `${req.user.first_name}`
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  // get room's list for loggedin user
  getAllRoomsList: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const rooms = await roomServices.getAllRoomsList(req.user.user_id, req.user, req?.query?.cust_id, t);
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: rooms,
        Message: CONSTANTS.ROOM_DETAILS
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },
  // disable room for child
  disableRoom: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;

      const room = await roomServices.disableRoom(params, t);

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: room,
        Message: CONSTANTS.ROOM_UPDATED
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Room',
        function_type: 'Disable',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },
  // enable room for child
  enableRoom: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;

      const room = await roomServices.enableRoom(params, t);

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: room,
        Message: CONSTANTS.ROOM_UPDATED
      });

      next();
    } catch (error) {
      console.log(error);
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Room',
        function_type: 'Disable',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  }
};
