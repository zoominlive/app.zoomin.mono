const _ = require('lodash');
const familyServices = require('../services/families');
const childServices = require('../services/children');

module.exports = {
  createFamily: async (req, res, next) => {
    try {
      let { primary, secondary, children } = req.body;
      const userId = req.user.user_id;
      const custId = req.user.cust_id;

      //add primary parent

      primary.family_id = await familyServices.generateNewFamilyId(req.user.user_id);
      let primaryParent = await familyServices.createFamily({
        ...primary,
        user_id: userId,
        cust_id: custId
      });

      const familyId = primaryParent.family_id;

      //add secondary parent

      let secondaryParents = '';
      let createdFamily = Promise.all(
        secondary.map(async (family) => {
          const newFamily = await familyServices.createFamily({
            ...family,
            user_id: userId,
            cust_id: custId,
            family_id: familyId
          });

          return newFamily;
        })
      );
      secondaryParents = await createdFamily;

      //add children

      childServices;

      let createdChildren = Promise.all(
        children.map(async (child) => {
          const newFamily = await childServices.createChild({
            ...child,
            rooms: { rooms: child.rooms },
            family_id: familyId
          });

          return newFamily;
        })
      );
      children = await createdChildren;

      res.status(201).json({
        IsSuccess: true,
        Data: { primaryParent, secondaryParents, children },
        Message: 'New  Family Created'
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

  editFamily: async (req, res, next) => {
    try {
      const params = req.body;

      const editedFamily = await familyServices.editFamily(params);

      res.status(200).json({
        IsSuccess: true,
        Data: editedFamily,
        Message: 'family details updated'
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
        pageNumber: req.body?.pageNumber,
        pageSize: req.body?.pageSize,
        roomsList: req.body?.rooms,
        location: req.body?.location,
        searchBy: req.body?.searchBy
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
