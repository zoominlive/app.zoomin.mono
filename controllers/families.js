const _ = require('lodash');
const familyServices = require('../services/families');

module.exports = {
  createFamily: async (req, res, next) => {
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id;

      if (params?.member_type === 'primary') {
        params.family_id = await familyServices.generateNewFamilyId(req.user.user_id);
      }

      let createdFamily1 = '';
      if (params?.families) {
        let createdFamily = Promise.all(
          params.families.map(async (family) => {
            const paramsObj = _.omit(params, ['families']);
            const newFamily = await familyServices.createFamily({ ...paramsObj, ...family });

            return newFamily;
          })
        );
        createdFamily1 = await createdFamily;
      }

      res.status(201).json({
        IsSuccess: true,
        Data: createdFamily1,
        Message: 'New  Family member Created'
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
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id;

      let editedFamilies = '';
      if (params) {
        let editFamily = Promise.all(
          params.families.map(async (family) => {
            const newFamily = await familyServices.editFamily({ ...family });

            return newFamily;
          })
        );
        editedFamilies = await editFamily;
      }

      res.status(200).json({
        IsSuccess: true,
        Data: editedFamilies,
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
