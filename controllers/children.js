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
  }
};
