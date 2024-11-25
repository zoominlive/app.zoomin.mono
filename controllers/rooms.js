const roomServices = require('../services/rooms');
const cameraServices = require('../services/cameras');
const logServices = require('../services/logs');
const CONSTANTS = require('../lib/constants');
const _ = require('lodash');
const sequelize = require('../lib/database');
const customerServices = require('../services/customers');
const RoomsInChild = require('../models/rooms_assigned_to_child');
const Child = require('../models/child');
const constants = require('../lib/constants');

module.exports = {
  // create new room
  createRoom: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      let validCameras = [];
      let validationMessages = [];
      const userLocations = req.user.locations.map((item) => item.loc_id); 
      // Location validation
      if (!userLocations.includes(params.location) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access. Please enter the location you have access to"})
      }
      // Validate all cameras before proceeding
      for (const camera of params.cameras) {
        const validation = await cameraServices.validateCamera(camera.cam_id, params.cust_id);
        if (validation.valid) {
          validCameras.push(camera);
        } else {
          validationMessages.push(validation.message);
        }
      }

       // Check if there's at least one valid camera
      // if (validCameras.length === 0) {
      //   await t.rollback();
      //   return res.status(400).json({
      //     IsSuccess: false,
      //     Message: "No valid cameras found. " + validationMessages.join(" "),
      //   });
      // }
      params.loc_id = params.location;
      const room = await roomServices.createRoom(params, validCameras, t);

      if (room) {
        await customerServices.editCustomer(
          params.cust_id,
          {max_stream_live_license_room: params.max_stream_live_license_room},
          t
        );
      }
      validCameras.forEach(async (camera) => {
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
        Message: CONSTANTS.ROOM_CREATED + ' ' + validationMessages.join(" ")
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
      params.custId = req.user.cust_id || req.body.cust_id;
      let validCameras = [];
      let validationMessages = [];
      const userLocations = req.user.locations.map((item) => item.loc_id); 
      // Location validation      
      if (!userLocations.includes(params.location) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access. Please enter the location you have access to"})
      }
      // Validate Room
      const validation = await roomServices.validateRoom(params.room_id, params.custId);
      if (!validation.valid) {
        await t.rollback();
        return res.status(400).json({Message: validation.message});
      }

      // Validate all cameras before proceeding
      if (!params.camerasToAdd){
        params.camerasToAdd = params.cameras
      }
      for (const camera of params.camerasToAdd) {
        const validation = await cameraServices.validateCamera(camera.cam_id, params.custId);
        if (validation.valid) {
          validCameras.push(camera);
        } else {
          validationMessages.push(validation.message);
        }
      }

      // Check if there's at least one valid camera
      // if (validCameras.length === 0) {
      //   await t.rollback();
      //   return res.status(400).json({
      //     IsSuccess: false,
      //     Message: "No valid cameras found. " + validationMessages.join(" "),
      //   });
      // }
      const room = await roomServices.editRoom(req.user, params, validCameras, t);

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
      const validation = await roomServices.validateRoom(params.room_id, req.user.cust_id || custId);
      if (!validation.valid && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: validation.message});
      }
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
      if(filter.cust_id !== "" && filter.cust_id !== undefined) {
        if (req.user.role !== 'Super Admin' && req.user.cust_id !== filter.cust_id) {
          return res.status(400).json({Message:"Unauthorized request"});
        }
      }
      const rooms = await roomServices.getAllRoomsDetails(req.user.user_id, req.user, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: rooms,
        Message: CONSTANTS.ROOM_DETAILS
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
      const roomChildExist = await RoomsInChild.findOne({where:{room_child_id: params.room_child_id}});
      if(!roomChildExist) {
        await t.rollback();
        return res.status(400).json({Message: "Data not found"})
      }
      const roomDetails = await RoomsInChild.findAll({
        where: { room_child_id: params.room_child_id },
        include: [{ model: Child, as: "child" }]
      });
      let childCustId = roomDetails[0].dataValues.child.dataValues.cust_id;
      if (childCustId !== req.user.cust_id) {
        await t.rollback();
        return res.status(400).json({Message: constants.CUSTOMER_NOT_FOUND})
      }
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
      const roomChildExist = await RoomsInChild.findOne({where:{room_child_id: params.room_child_id}});
      if(!roomChildExist) {
        await t.rollback();
        return res.status(400).json({Message: "Data not found"})
      }
      const roomDetails = await RoomsInChild.findAll({
        where: { room_child_id: params.room_child_id },
        include: [{ model: Child, as: "child" }]
      });
      let childCustId = roomDetails[0].dataValues.child.dataValues.cust_id;
      if (childCustId !== req.user.cust_id) {
        await t.rollback();
        return res.status(400).json({Message: constants.CUSTOMER_NOT_FOUND})
      }
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
