const _ = require('lodash');
const childServices = require('../services/children');
const logServices = require('../services/logs');
const dashboardServices = require('../services/dashboard');
const CONSTANTS = require('../lib/constants');
const sequelize = require('../lib/database');
const Room = require('../models/room');
const RoomsInChild = require('../models/rooms_assigned_to_child');

module.exports = {
  // create new child
  createChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      let params = req.body;

      //add children
      const custId = req?.user?.cust_id || req?.body?.cust_id
      const childLocation = params.location.locations;
      if (!childLocation.every(location => req.user.location.accessable_locations.includes(location)) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access"});
      }
      const newChild = await childServices.createChild(custId, params, t);

      const addRoomsToChild = await childServices.assignRoomsToChild(
        newChild?.child_id,
        params?.rooms?.rooms,
        t
      );
      //await dashboardServices.updateDashboardData(custId);
      await t.commit();
      res.status(201).json({
        IsSuccess: true,
        Data: newChild,
        Message: CONSTANTS.CHILD_CREATED
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
        function: 'Child',
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

  // edit existing child
  editChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const childLocation = params.location.locations;
      const childDetails = await childServices.getChildById(params.child_id, t);
      if (childDetails.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to child:"+ params.child_id})
      }
      if (!childLocation.every(location => req.user.location.accessable_locations.includes(location)) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access"});
      }
      const editedChild = await childServices.editChild(params, t);

      const roomsEdited = await childServices.editAssignedRoomsToChild(
        params.child_id,
        params?.rooms?.rooms,
        t
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: editedChild,
        Message: CONSTANTS.CHILD_DETAILS_UPDATED
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
        function: 'Child',
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

  // update room
  updateChildRoom: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      
      const editedChild = await childServices.editChild(params, t);
    
      // Extract room IDs from the payload
      const roomIds = params.rooms.rooms.map(room => room.room_id);

      // Find rooms that exist in the Rooms table
      const existingRooms = await Room.findAll({
        where: { room_id: roomIds },
      });
      console.log('existing Rooms', existingRooms.length);
      
      if (existingRooms.length === 0) {
        await t.rollback();
        return res.status(400).json({Message: "None of the rooms exist in the database. Please create a room first"});
      }
      console.log('===out of scope===');
      
      // Extract IDs of existing rooms
      const existingRoomIds = existingRooms.map(room => room.room_id);

      // Identify rooms that do not exist
      const nonExistentRooms = params.rooms.rooms.filter(room => !existingRoomIds.includes(room.room_id));

      // Prepare data for existing rooms
      const roomInsertData = existingRooms.map(room => ({
          child_id: params.child_id,
          room_id: room.room_id,
          disabled: "false"
      }));

      await RoomsInChild.destroy(
        { where: { child_id: params.child_id }, raw: true },
        { transaction: t }
      );

      // Insert the records into RoomsInChild table
      await RoomsInChild.bulkCreate(roomInsertData, { transaction: t });

      await t.commit();
      // Prepare the response message
      const responseMessage = {
        message: "Rooms processing completed.",
        addedRooms: existingRooms.map((room) => ({
          room_id: room.room_id,
          room_name: room.room_name,
        })),
        nonExistentRooms: nonExistentRooms.map((room) => ({
          room_id: room.room_id,
          room_name: room.room_name,
        })),
      };

      // Send the response
      res.status(200).json(responseMessage);
    
    
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
        function: 'Child',
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

  // delete child by id
  deleteChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const childDetails = await childServices.getChildById(params.child_id, t);
      if (childDetails.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to child:"+ params.child_id})
      }
      const roomsDeleted = await childServices.deleteAssignedRoomsToChild(params.child_id, t);

      const child = await childServices.deleteChild(params.child_id, t);

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.CHILD_DELETED
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
        function: 'Child',
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

  // disable selected child
  disableChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;

      const childDetails = await childServices.getChildById(params.child_id, t);
      if (childDetails.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to child:"+ params.child_id})
      }
      if (childDetails?.location?.locations?.length == params?.locations_to_disable?.length) {
        const disableChild = await childServices.disableChild(
          params?.child_id,
          params?.scheduled_end_date ? params?.scheduled_end_date : null,
          t
        );
      } else {
      if(params?.locations_to_disable?.length){
        const locationsDisabled = await childServices.disableSelectedLocations(
          params?.child_id,
          params?.scheduled_end_date ? params?.scheduled_end_date : null,
          params?.locations_to_disable
        );
      }
      else{
        const disableChild = await childServices.disableChild(
          params?.child_id,
          params?.scheduled_end_date ?params?.scheduled_end_date: null,
          t
        );
      }
       
      }

      await t.commit();

      if (params?.scheduled_end_date) {
        res.status(200).json({
          IsSuccess: true,
          Data: { scheduled: true },
          Message: CONSTANTS.CHILD_SCHEDULED
        });
      } else {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.CHILD_DISABLED
        });
      }

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
        function: 'Child',
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

  // enable selected child
  enableChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const childDetails = await childServices.getChildById(params.child_id, t);
      if (childDetails.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to child:"+ params.child_id})
      }
      const enableChild = await childServices.enableChild(params.child_id, t);
      
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: enableChild,
        Message: CONSTANTS.CHILD_ENABLED
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
        function: 'Child',
        function_type: 'Enable',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  addRoomInChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { child_id, existingRooms, roomsToAdd, selectedOption, schedule_enable_date } =
        req.body;

      let roomsinChild = [];

      existingRooms.forEach((room) => roomsinChild.push(room));
      roomsToAdd.forEach((room) => roomsinChild.push(room));

      let update = {
        child_id: child_id,
        rooms: { rooms: roomsinChild }
      };
      const childEdit = childServices.editChild(update, t);

      const roomsAdded = await childServices.addNewRoomsToChild(
        child_id,
        roomsToAdd,
        selectedOption,
        schedule_enable_date,
        t
      );

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: roomsAdded,
        Message: CONSTANTS.ROOMS_ADDED
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
        function: 'Child',
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

  changeRoomScheduler: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { room_child_id, timeRange } = req.body;

      const schedulerAdded = await childServices.changeRoomScheduler(
        room_child_id,
        { timeRange },
        t
      );

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: schedulerAdded,
        Message: CONSTANTS.ROOM_SCHEDULER_CHANGED
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
        function: 'Child',
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

  changeDefaultRoomScheduler: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { cust_id, timeRange } = req.body;

      const schedulerAdded = await childServices.changeDefaultRoomScheduler(
        cust_id,
        { timeRange },
        t
      );

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: schedulerAdded,
        Message: CONSTANTS.DEFAULT_SETTINGS_UPDATED
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
        function: 'Child',
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

  getScheduleDetails: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { cust_id } = req.query;

      const schedulerAdded = await childServices.getScheduleByCustId(
        cust_id,
        t
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: schedulerAdded,
        Message: "Cust Schedule Fetched"
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
        function: 'Child',
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

  deleteRoomInChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;

      const roomsDeleted = await childServices.deleteRoomInChild(params.child_id, params.room_id, t);

      //const child = await childServices.deleteChild(params.child_id, t);

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.CHILD_ROOM_DELETED
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
        function: 'Child',
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
};
