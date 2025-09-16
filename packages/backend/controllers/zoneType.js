const CONSTANTS = require('../lib/constants');
const _ = require('lodash');
const { sequelize } = require('../lib/database');
const zoneTypeServices = require('../services/zoneType');
const logServices = require('../services/logs');

module.exports = {
  // create new zone type
  createZoneType: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id || req.body.cust_id;

      if (params.zone_type.length > 10) {
        return res.status(400).json({ error: 'Zone type must be at most 10 characters' });
      }

      const zoneType = await zoneTypeServices.createZoneType(params, t);

      await t.commit();
      res.status(201).json({
        IsSuccess: true,
        Data: zoneType,
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
        function: 'Zone Type',
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

  // edit existing zone type
  editZoneType: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.custId = req.user.cust_id || req.body.cust_id;
   
      const zoneType = await zoneTypeServices.editZoneType(params, t);

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: zoneType,
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
        function: 'Zone Type',
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

  // delete existing zone type
  deleteZoneType: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      await zoneTypeServices.deleteZoneType(params.zone_type_id, t);

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
        function: 'Zone Type',
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

  // get zone type details for zone types list page
  getAllZoneTypeDetails: async (req, res, next) => {
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
      const zonesTypes = await zoneTypeServices.getAllZoneTypeDetails(req.user, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: zonesTypes,
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
