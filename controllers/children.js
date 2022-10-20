const _ = require('lodash');
const familyServices = require('../services/families');
const childServices = require('../services/children');

module.exports = {
  createChild: async (req, res, next) => {
    try {
      let params = req.body;

      //add children

      const newChild = await childServices.createChild(params);

      res.status(201).json({
        IsSuccess: true,
        Data: newChild,
        Message: 'New Child Created'
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

  editChild: async (req, res, next) => {
    try {
      const params = req.body;

      const editedChild = await childServices.editChild(params);

      res.status(200).json({
        IsSuccess: true,
        Data: editedChild,
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
  deleteChild: async (req, res, next) => {
    try {
      const params = req.body;
      const child = await childServices.deleteChild(params.child_id);

      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: 'Child Deleted'
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
          Message: 'Child is schedlued to disable on selected date'
        });
      } else {
        res.status(200).json({
          IsSuccess: true,
          Data: disableChild,
          Message: 'Child successfully disabled'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },
  enableChild: async (req, res, next) => {
    try {
      const params = req.body;

      const enableChild = await childServices.enableChild(params.child_id);

      res.status(200).json({
        IsSuccess: true,
        Data: enableChild,
        Message: 'Child successfully enabled'
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
