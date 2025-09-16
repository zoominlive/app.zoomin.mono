const zoneServices = require('../services/zones');
const cameraServices = require('../services/cameras');
const logServices = require('../services/logs');
const CONSTANTS = require('../lib/constants');
const _ = require('lodash');
const { sequelize } = require('../lib/database');
const customerServices = require('../services/customers');
const ZonesInChild = require('../models/zones_assigned_to_child');
const Child = require('../models/child');
const constants = require('../lib/constants');

module.exports = {
  // create new zone
  createZone: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      params.user_id = req.user.user_id;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      let validCameras = [];
      let validationMessages = [];
      const userLocations = req.user.locations.map((item) => item.loc_id); 
      // Location validation
      if (!userLocations.includes(params.location) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access. Please enter the location you have access to"})
      }
      // Validate all cameras before proceeding
      for (const camera of params.cameras) {
        const validation = await cameraServices.validateCamera(camera.cam_id, params.cust_id);
        if (validation.valid) {
          validCameras.push(camera);
        } else {
          validationMessages.push(validation.message);
        }
      }

       // Check if there's at least one valid camera
      // if (validCameras.length === 0) {
      //   await t.rollback();
      //   return res.status(400).json({
      //     IsSuccess: false,
      //     Message: "No valid cameras found. " + validationMessages.join(" "),
      //   });
      // }
      params.loc_id = params.location;
      const zone = await zoneServices.createZone(params, validCameras, t);

      if (zone) {
        await customerServices.editCustomer(
          params.cust_id,
          {max_stream_live_license_zone: params.max_stream_live_license_zone},
          t
        );
      }
      validCameras.forEach(async (camera) => {
        let zones = [];

        if (!_.isEmpty(camera.zone_ids)) {
          zones = camera.zone_ids.zones;
        }
        zones.push({ zone_name: zone.zone_name, zone_id: zone.zone_id });

        await cameraServices.editCamera(camera.cam_id, { zone_ids: { zones: zones } }, null, t);
      });

      await t.commit();
      res.status(201).json({
        IsSuccess: true,
        Data: zone,
        Message: CONSTANTS.ZONE_CREATED + ' ' + validationMessages.join(" ")
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
      let validCameras = [];
      let validationMessages = [];
      const userLocations = req.user.locations.map((item) => item.loc_id); 
      // Location validation      
      if (!userLocations.includes(params.location) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access. Please enter the location you have access to"})
      }
      // Validate Zone
      const validation = await zoneServices.validateZone(params.zone_id, params.custId);
      if (!validation.valid) {
        await t.rollback();
        return res.status(400).json({Message: validation.message});
      }

      // Validate all cameras before proceeding
      if (!params.camerasToAdd){
        params.camerasToAdd = params.cameras
      }
      for (const camera of params.camerasToAdd) {
        const validation = await cameraServices.validateCamera(camera.cam_id, params.custId);
        if (validation.valid) {
          validCameras.push(camera);
        } else {
          validationMessages.push(validation.message);
        }
      }

      // Check if there's at least one valid camera
      // if (validCameras.length === 0) {
      //   await t.rollback();
      //   return res.status(400).json({
      //     IsSuccess: false,
      //     Message: "No valid cameras found. " + validationMessages.join(" "),
      //   });
      // }
      const zone = await zoneServices.editZone(req.user, params, validCameras, t);

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: zone,
        Message: CONSTANTS.ZONE_UPDATED
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
      const { custId, max_stream_live_license_zone } = params;
      const validation = await zoneServices.validateZone(params.zone_id, req.user.cust_id || custId);
      if (!validation.valid && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: validation.message});
      }
      const zone = await zoneServices.deleteZone(params.zone_id, t);
      if(zone && custId && max_stream_live_license_zone){
        await customerServices.editCustomer(
          custId,
          {max_stream_live_license_zone: max_stream_live_license_zone},
          t
          );
        }
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.ZONE_DELETED
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
  getAllZonesDetails: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: parseInt(req.query?.pageNumber) + 1,
        pageSize: parseInt(req.query?.pageSize),
        zonesList: req.query?.zones,
        location: req.query?.location,
        type: req.query?.type,
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'"),
        cust_id: req.query?.cust_id
      };
      if(filter.cust_id !== "" && filter.cust_id !== undefined) {
        if (req.user.role !== 'Super Admin' && req.user.cust_id !== filter.cust_id) {
          return res.status(400).json({Message:"Unauthorized request"});
        }
      }
      const zones = await zoneServices.getAllZonesDetails(req.user.user_id, req.user, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: zones,
        Message: CONSTANTS.ZONE_DETAILS
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

  // get zone's list for loggedin user
  getAllZonesList: async (req, res, next) => {
    try {
      const zones = await zoneServices.getAllZonesList(req.user.user_id, req.user, req?.query?.cust_id);
      res.status(200).json({
        IsSuccess: true,
        Data: zones,
        Message: CONSTANTS.ZONE_DETAILS
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
  // disable zone for child
  disableZone: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const zoneChildExist = await ZonesInChild.findOne({where:{zone_child_id: params.zone_child_id}});
      if(!zoneChildExist) {
        await t.rollback();
        return res.status(400).json({Message: "Data not found"})
      }
      const zoneDetails = await ZonesInChild.findAll({
        where: { zone_child_id: params.zone_child_id },
        include: [{ model: Child, as: "child" }]
      });
      let childCustId = zoneDetails[0].dataValues.child.dataValues.cust_id;
      if (req.user.role !== 'Super Admin' && childCustId !== req.user.cust_id) {
        await t.rollback();
        return res.status(400).json({Message: constants.CUSTOMER_NOT_FOUND})
      }
      const zone = await zoneServices.disableZone(params, t);

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: zone,
        Message: CONSTANTS.ZONE_UPDATED
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
  // enable zone for child
  enableZone: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const zoneChildExist = await ZonesInChild.findOne({where:{zone_child_id: params.zone_child_id}});
      if(!zoneChildExist) {
        await t.rollback();
        return res.status(400).json({Message: "Data not found"})
      }
      const zoneDetails = await ZonesInChild.findAll({
        where: { zone_child_id: params.zone_child_id },
        include: [{ model: Child, as: "child" }]
      });
      let childCustId = zoneDetails[0].dataValues.child.dataValues.cust_id;
      if (req.user.role !== 'Super Admin' && childCustId !== req.user.cust_id) {
        await t.rollback();
        return res.status(400).json({Message: constants.CUSTOMER_NOT_FOUND})
      }
      const zone = await zoneServices.enableZone(params, t);

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: zone,
        Message: CONSTANTS.ZONE_UPDATED
      });

      next();
    } catch (error) {
      console.log(error);
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
        function_type: 'Disable',
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
