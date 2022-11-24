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

      const disableChild = await childServices.disableChild(
        params?.child_id,
        params?.scheduled_end_date
      );

      if (params?.scheduled_end_date) {
        res.status(200).json({
          IsSuccess: true,
          Data: disableChild,
          Message: CONSTANTS.CHILD_SCHEDULED
        });
      } else {
        res.status(200).json({
          IsSuccess: true,
          Data: disableChild,
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

      const enableChild = await childServices.enableChild(params.child_id);

      res.status(200).json({
        IsSuccess: true,
        Data: enableChild,
        Message: CONSTANTS.CHILD_ENABLED
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  }
};
