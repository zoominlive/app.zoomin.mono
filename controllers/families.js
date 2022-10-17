const { param } = require('../routes/api');
const familyServices = require('../services/families');

module.exports = {
  createFamily: async (req, res, next) => {
    try {
      console.log('hello');
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id;

      if (params?.member_type === 'primary') {
        params.family_id = await familyServices.generateNewFamilyId(req.user.user_id);
      }

      if (params?.families) {
        params.families.forEach(async (family) => {
          const paramsObj = _.omit(params, ['families']);
          const newFamily = await familyServices.createFamily({ ...paramsObj, ...family });
        });
      }

      res.status(201).json({
        IsSuccess: true,
        Data: newFamily,
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
