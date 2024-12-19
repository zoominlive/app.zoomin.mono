const CONSTANTS = require('../lib/constants');
const _ = require('lodash');
const sequelize = require('../lib/database');
const zoneServices = require('../services/zone');
const logServices = require('../services/logs');

module.exports = {
  // create new zone
  createZone: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id || req.body.cust_id;

      if (params.zone_name.length > 10) {
        return res.status(400).json({ error: 'Zone name must be at most 10 characters' });
      }

      const zone = await zoneServices.createZone(params, t);

      await t.commit();
      res.status(201).json({
        IsSuccess: true,
        Data: zone,
        Message: CONSTANTS.ZONE_TYPE_CREATED
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
        function: 'Zone',
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

  // edit existing zone
  editZone: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.custId = req.user.cust_id || req.body.cust_id;
   
      const zone = await zoneServices.editZone(params, t);

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: zone,
        Message: CONSTANTS.ZONE_TYPE_UPDATED
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
        function: 'Zone',
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

  // delete existing zone
  deleteZone: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      await zoneServices.deleteZone(params.zone_id, t);

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.ZONE_TYPE_DELETED
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
        function: 'Zone',
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

  // get zone details for zone list page
  getAllZoneDetails: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'"),
        pageCount: req.query?.pageCount,
        orderBy: req.query?.orderBy,
        all: req.query?.all,
        cust_id: req.query?.cust_id
      };
      if(filter.cust_id !== "" && filter.cust_id !== undefined) {
        if (req.user.role !== 'Super Admin' && req.user.cust_id !== filter.cust_id) {
          return res.status(400).json({Message:"Unauthorized request"});
        }
      }
      const zones = await zoneServices.getAllZoneDetails(req.user, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: zones,
        Message: CONSTANTS.ZONE_TYPE_DETAILS
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
};
