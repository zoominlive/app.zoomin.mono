const _ = require('lodash');
const childServices = require('../services/children');
const logServices = require('../services/logs');
const dashboardServices = require('../services/dashboard');
const CONSTANTS = require('../lib/constants');
const { sequelize } = require('../lib/database');
const Zone = require('../models/zone');
const ZonesInChild = require('../models/zones_assigned_to_child');

module.exports = {
  // create new child
  createChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      let params = req.body;

      //add children
      const custId = req?.user?.cust_id || req?.body?.cust_id
      const childLocation = params.location.locations.map((item) => item.loc_id);
      if (!childLocation.every(location => req.user.locations.map((item) => item.loc_id).includes(location)) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access"});
      }
      const newChild = await childServices.createChild(custId, params, t);

      const addZonesToChild = await childServices.assignZonesToChild(
        newChild?.child_id,
        params?.zones?.zones,
        t
      );
      //await dashboardServices.updateDashboardData(custId);
      await t.commit();
      res.status(201).json({
        IsSuccess: true,
        Data: newChild,
        Message: CONSTANTS.CHILD_CREATED
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
        function: 'Child',
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

  // edit existing child
  editChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const childLocation = params.location.locations.map((item) => item.loc_id);
      const childDetails = await childServices.getChildById(params.child_id, t);
      if (childDetails.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to child:"+ params.child_id})
      }
      if (!childLocation.every(location => req.user.locations.map((item) => item.loc_id).includes(location)) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access"});
      }
      const editedChild = await childServices.editChild(params, t);

      const zonesEdited = await childServices.editAssignedZonesToChild(
        params.child_id,
        params?.zones?.zones,
        t
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: editedChild,
        Message: CONSTANTS.CHILD_DETAILS_UPDATED
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
        function: 'Child',
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

  // update zone
  updateChildZone: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      
      const editedChild = await childServices.editChild(params, t);
    
      // Extract zone IDs from the payload
      const zoneIds = params.zones.zones.map(zone => zone.zone_id);

      // Find zones that exist in the Zones table
      const existingZones = await Zone.findAll({
        where: { zone_id: zoneIds },
      });
      
      if (existingZones.length === 0) {
        await t.rollback();
        return res.status(400).json({Message: "None of the zones exist in the database. Please create a zone first"});
      }
      
      // Extract IDs of existing zones
      const existingZoneIds = existingZones.map(zone => zone.zone_id);

      // Identify zones that do not exist
      const nonExistentZones = params.zones.zones.filter(zone => !existingZoneIds.includes(zone.zone_id));

      // Prepare data for existing zones
      const zoneInsertData = existingZones.map(zone => ({
          child_id: params.child_id,
          zone_id: zone.zone_id,
          disabled: "false"
      }));

      await ZonesInChild.destroy(
        { where: { child_id: params.child_id }, raw: true },
        { transaction: t }
      );

      // Insert the records into ZonesInChild table
      await ZonesInChild.bulkCreate(zoneInsertData, { transaction: t });

      await t.commit();
      // Prepare the response message
      const responseMessage = {
        message: "Zones processing completed.",
        addedZones: existingZones.map((zone) => ({
          zone_id: zone.zone_id,
          zone_name: zone.zone_name,
        })),
        nonExistentZones: nonExistentZones.map((zone) => ({
          zone_id: zone.zone_id,
          zone_name: zone.zone_name,
        })),
      };

      // Send the response
      res.status(200).json(responseMessage);
    
    
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
        function: 'Child',
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

  // delete child by id
  deleteChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const childDetails = await childServices.getChildById(params.child_id, t);
      if (childDetails.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to child:"+ params.child_id})
      }
      const zonesDeleted = await childServices.deleteAssignedZonesToChild(params.child_id, t);

      const child = await childServices.deleteChild(params.child_id, t);

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.CHILD_DELETED
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
        function: 'Child',
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

  // disable selected child
  disableChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;

      const childDetails = await childServices.getChildById(params.child_id, t);
      if (childDetails.dataValues.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to child:"+ params.child_id})
      }
      
      if (childDetails?.dataValues?.child_locations?.length == params?.locations_to_disable?.length) {
        const disableChild = await childServices.disableChild(
          params?.child_id,
          params?.scheduled_end_date ? params?.scheduled_end_date : null,
          t
        );
      } else {
      if(params?.locations_to_disable?.length){
        const locationsDisabled = await childServices.disableSelectedLocations(
          params?.child_id,
          params?.scheduled_end_date ? params?.scheduled_end_date : null,
          params?.locations_to_disable
        );
      }
      else{
        const disableChild = await childServices.disableChild(
          params?.child_id,
          params?.scheduled_end_date ?params?.scheduled_end_date: null,
          t
        );
      }
       
      }

      await t.commit();

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
        function: 'Child',
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

  // enable selected child
  enableChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const childDetails = await childServices.getChildById(params.child_id, t);
      if (childDetails.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to child:"+ params.child_id})
      }
      const enableChild = await childServices.enableChild(params.child_id, t);
      
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: enableChild,
        Message: CONSTANTS.CHILD_ENABLED
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
        function: 'Child',
        function_type: 'Enable',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  addZoneInChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { child_id, existingZones, zonesToAdd, selectedOption, schedule_enable_date } =
        req.body;

      let zonesInChild = [];

      existingZones.forEach((zone) => zonesInChild.push(zone));
      zonesToAdd.forEach((zone) => zonesInChild.push(zone));

      let update = {
        child_id: child_id,
        zones: { zones: zonesInChild }
      };
      const childEdit = childServices.editChild(update, t);

      const zonesAdded = await childServices.addNewZonesToChild(
        child_id,
        zonesToAdd,
        selectedOption,
        schedule_enable_date,
        t
      );

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: zonesAdded,
        Message: CONSTANTS.ZONES_ADDED
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
        function: 'Child',
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

  changeZoneScheduler: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { zone_child_id, timeRange } = req.body;

      const schedulerAdded = await childServices.changeZoneScheduler(
        zone_child_id,
        { timeRange },
        t
      );

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: schedulerAdded,
        Message: CONSTANTS.ZONE_SCHEDULER_CHANGED
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
        function: 'Child',
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

  changeDefaultZoneScheduler: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { cust_id, timeRange, allowCustomSchedule } = req.body;

      const schedulerAdded = await childServices.changeDefaultZoneScheduler(
        cust_id,
        { timeRange, allowCustomSchedule },
        t
      );

      await t.commit();

      res.status(200).json({
        IsSuccess: true,
        Data: schedulerAdded,
        Message: CONSTANTS.DEFAULT_SETTINGS_UPDATED
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
        function: 'Child',
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

  getScheduleDetails: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { cust_id } = req.query;

      const schedulerAdded = await childServices.getScheduleByCustId(
        cust_id,
        t
      );

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: schedulerAdded,
        Message: "Cust Schedule Fetched"
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
        function: 'Child',
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

  deleteZoneInChild: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;

      const zonesDeleted = await childServices.deleteZoneInChild(params.child_id, params.zone_id, t);

      //const child = await childServices.deleteChild(params.child_id, t);

      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.CHILD_ZONE_DELETED
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
        function: 'Child',
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
};
