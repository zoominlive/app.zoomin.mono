const _ = require('lodash');
const familyServices = require('../services/families');
const childServices = require('../services/children');
const CONSTANTS = require('../lib/constants');
module.exports = {
  // create new child
  createChild: async (req, res, next) => {
    try {
      let params = req.body;

      //add children

      const newChild = await childServices.createChild(params);

      const addRoomsToChild = await childServices.assignRoomsToChild(
        newChild?.child_id,
        params?.rooms?.rooms
      );

      res.status(201).json({
        IsSuccess: true,
        Data: newChild,
        Message: CONSTANTS.CHILD_CREATED
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  // edit existing child
  editChild: async (req, res, next) => {
    try {
      const params = req.body;

      const editedChild = await childServices.editChild(params);

      const roomsEdited = await childServices.editAssignedRoomsToChild(
        params.child_id,
        params?.rooms?.rooms
      );

      res.status(200).json({
        IsSuccess: true,
        Data: editedChild,
        Message: CONSTANTS.CHILD_DETAILS_UPDATED
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  // delete child by id
  deleteChild: async (req, res, next) => {
    try {
      const params = req.body;

      const roomsDeleted = await childServices.deleteAssignedRoomsToChild(params.child_id);

      const child = await childServices.deleteChild(params.child_id);

      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.CHILD_DELETED
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  // disable selected child
  disableChild: async (req, res, next) => {
    try {
      const params = req.body;

      const childDetails = await childServices.getChildById(params.child_id);

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
        roomIdsToDisable
      );
      if (!params.scheduled_end_date) {
        const updateChild = await childServices.editChild({
          child_id: params.child_id,
          rooms: { rooms: roomsToAdd }
        });
      }

      const disableChild = await childServices.disableChild(
        params?.child_id,
        params?.scheduled_end_date
      );

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
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  // enable selected child
  enableChild: async (req, res, next) => {
    try {
      const params = req.body;

      const roomsToAdd = await childServices.addRoomsToChild(params.child_id);

      const enableChild = await childServices.enableChild(params.child_id, {
        rooms: roomsToAdd.map((room) => room.rooms[0])
      });

      res.status(200).json({
        IsSuccess: true,
        Data: enableChild,
        Message: CONSTANTS.CHILD_ENABLED
      });

      next();
    } catch (error) {
      console.log(error);
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  }
};
