const _ = require('lodash');
const childServices = require('../services/children');
const logServices = require('../services/logs');
const CONSTANTS = require('../lib/constants');
const sequelize = require('../lib/database');
module.exports = {
  // create new child
  createChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      let params = req.body;

      //add children

      const newChild = await childServices.createChild(params, t);

      const addRoomsToChild = await childServices.assignRoomsToChild(
        newChild?.child_id,
        params?.rooms?.rooms,
        t
      );

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

      let roomsToAdd = childDetails?.rooms?.rooms?.filter((room) => {
        const result = _.find(params?.locations_to_disable, function (n) {
          if (n === room?.location) {
            return true;
          }
        });

        return result == undefined;
      });

      const roomIdsToDisable = roomsToAdd.map((room) => room.room_id);

      const roomsDisabled = await childServices.disableSelectedRoomsForChild(
        params.child_id,
        roomIdsToDisable,
        t
      );
      if (!params.scheduled_end_date) {
        const updateChild = await childServices.editChild(
          {
            child_id: params.child_id,
            rooms: { rooms: roomsToAdd }
          },
          t
        );
      }

      const disableChild = await childServices.disableChild(
        params?.child_id,
        params?.scheduled_end_date,
        t
      );

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

      const roomsToAdd = await childServices.addRoomsToChild(params.child_id, t);

      const enableChild = await childServices.enableChild(
        params.child_id,
        {
          rooms: roomsToAdd.map((room) => room.rooms[0])
        },
        t
      );

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
  }
};
