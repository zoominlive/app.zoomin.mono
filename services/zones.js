const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const _ = require("lodash");
const sequelize = require("../lib/database");
const { v4: uuidv4 } = require("uuid");
const CamerasInZones = require("../models/cameras_assigned_to_zones");
const customerServices = require('../services/customers');
const Zone = require("../models/zone");
const jwt = require('jsonwebtoken');

module.exports = {
  /* Create new zone */
  createZone: async (zoneObj, validCameras, t) => {
    const { Zone, CamerasInZones } = await connectToDatabase();
    zoneObj.zone_id = uuidv4();
    zoneObj.zone_type_id = zoneObj.zone;
    let zoneCreated = await Zone.create(zoneObj, { transaction: t });

    const camsToAdd = validCameras.map((cam) => {
      return {
        cam_id: cam.cam_id,
        zone_id: zoneCreated.zone_id,
      };
    });

    let camerasAssigned = await CamerasInZones.bulkCreate(camsToAdd, {
      transaction: t,
    });

    return zoneCreated !== undefined ? zoneCreated.toJSON() : null;
  },

  /* Edit zone details */
  editZone: async (user, params, validCameras, t) => {
    const { Zone, CamerasInZones } = await connectToDatabase();
    let update = {};

    if (params?.zone_name) {
      update.zone_name = params.zone_name;
    }
    if (params?.location) {
      update.location = params.location;
    }
    if (params?.disabled) {
      update.location = params.disabled;
    }
    if (params?.stream_live_license !== undefined) {
      update.stream_live_license = params?.stream_live_license
    }
    update.zone_type_id = params.zone;
    let updateZoneDetails = await Zone.update(
      update,
      {
        where: { zone_id: params.zone_id },
      },
      { transaction: t }
    );

    if (updateZoneDetails) {
      updateZoneDetails = await Zone.findOne(
        { where: { zone_id: params.zone_id } },
        { transaction: t }
      );
      await customerServices.editCustomer(
        params.cust_id || user.cust_id,
        {max_stream_live_license_zone: params.max_stream_live_license_zone},
        t
      );
    }

    const camsToAdd = validCameras.map((cam) => {
      return {
        cam_id: cam.cam_id,
        zone_id: params.zone_id,
      };
    });

    let camsRemoved = await CamerasInZones.destroy(
      {
        where: { zone_id: params.zone_id },
        raw: true,
      },
      { transaction: t }
    );

    let camsAdded = await CamerasInZones.bulkCreate(camsToAdd, {
      transaction: t,
    });

    return updateZoneDetails.toJSON();
  },

  /* Delete Existing zone */
  deleteZone: async (zoneId, t) => {
    const { Zone, CamerasInZones, ZonesInChild } = await connectToDatabase();
    let camsDeleted = await CamerasInZones.destroy(
      { where: { zone_id: zoneId }, raw: true },
      { transaction: t }
    );

    await ZonesInChild.destroy(
      { where: { zone_id: zoneId }, raw: true },
      { transaction: t }
    );

    let deletedZone = await Zone.destroy(
      {
        where: { zone_id: zoneId },
      },
      { transaction: t }
    );

    return deletedZone;
  },

  /* Fetch all the zone's details */
  getAllZonesDetails : async (userId, user, filter, t) => {
    const { Zone, Camera, CustomerLocations, ZoneType, CamerasInZones } = await connectToDatabase();
  
    let {
      pageNumber = 0,
      pageSize = 10,
      zonesList = [],
      location = [],
      searchBy = "",
      cust_id = null,
      type = "All"
    } = filter;
  
    // Adjust pageNumber for zero-based index
    pageNumber = Math.max(0, pageNumber - 1);
  
    // Determine location filter based on user role or customer ID
    let locationFilter = {};
    if (!cust_id) {
      locationFilter = { loc_id: user.locations.map((loc) => loc.loc_id) };
    } else {
      const availableLocations = await CustomerLocations.findAll({
        where: { cust_id },
        raw: true
      });
      locationFilter = { loc_id: availableLocations.map((loc) => loc.loc_id) };
    }
  
    // Build dynamic location condition
    let locCondition = {};
    if (Array.isArray(location) && location.length > 0 && !location.includes("All")) {
      locCondition = { loc_id: { [Sequelize.Op.in]: location } };
    }
  
    // Construct the query filter
    let zoneFilter = {
      cust_id: user.cust_id || cust_id,
      [Sequelize.Op.and]: [
        locationFilter,
        locCondition
      ],
      zone_name: { [Sequelize.Op.substring]: searchBy },
      ...(zonesList.length > 0 && { zone_name: zonesList }),
      ...(type !== "All" && { zone_type_id: { [Sequelize.Op.substring]: type } })
    };
  
    // Fetch zones
    let zones = await Zone.findAll({
      where: zoneFilter,
      attributes: ["zone_id", "zone_name", "loc_id", "stream_live_license", "zone_type_id"],
      include: [
        {
          model: CamerasInZones,
          attributes: ["cam_zone_id"],
          include: [{ model: Camera, attributes: ["cam_id", "cam_name", "loc_id", "stream_uri", "description", "cam_alias"] }]
        },
        { model: CustomerLocations, attributes: ["loc_name", "loc_id"] },
        { model: ZoneType, as: "zone_type", attributes: ["zone_type", "zone_type_id"] }
      ],
      distinct: true,
      transaction: t
    });
  
    // Apply pagination
    const count = zones.length;
    zones = zones.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);
  
    // Generate secure stream URIs
    const baseUrl = await customerServices.getTranscoderUrl(user?.cust_id, t);
    
    zones = zones.map((zone) => {
      let cams = zone.cameras_assigned_to_zones?.map((cam) => cam.camera)?.filter(Boolean) || [];
      
      cams.forEach((camera) => {
        if (!camera?.cam_id || !camera?.stream_uri) return;
        
        const token = jwt.sign(
          { user_id: user?.family_member_id || user?.user_id, cam_id: camera.cam_id, uuid: uuidv4() },
          process.env.STREAM_URL_SECRET_KEY,
          { expiresIn: "12h" }
        );
  
        camera.dataValues.stream_uri_seckey = `${baseUrl}${camera.stream_uri}?seckey=${token}`;
      });
  
      return {
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        location: zone.loc_id,
        loc_name: zone.customer_location?.loc_name || "Unknown Location",
        cameras: cams,
        stream_live_license: zone.stream_live_license,
        zone_type: zone.zone_type?.dataValues || {}
      };
    });
  
    return { finalZoneDetails: zones, count };
  },

  getZoneDetailsByZoneId: async(zoneId, t) => {
    const { Zone, Camera } = await connectToDatabase();

    zone = await Zone.findOne(
      {
        where: {
          zone_id: zoneId,
        },
        attributes: ["zone_id", "zone_name", "location", "stream_live_license"],
      },
      { transaction: t }
    );
    return {
      zone_id: zone.zone_id,
      zone_name: zone.zone_name,
      location: zone.location,
      stream_live_license: zone.stream_live_license
    };
  },
    
  // get all zone's list for loggedin user
  getAllZonesList: async (userId, user, cust_id = null, t) => {
    const { Zone, CustomerLocations } = await connectToDatabase();
    let zoneList;
    if (user.role === "Admin" || user.role === "Super Admin") {
      let loc_obj = {};
      if (!cust_id) {
        loc_obj = { loc_id: user.locations.map((item) => item.loc_id) };
      } else {
        let availableLocations = await CustomerLocations.findAll({
          where: { cust_id: cust_id },
          raw: true,
        });
        let locs = availableLocations.flatMap((i) => i.loc_id);
        loc_obj = { loc_id: locs };
      }


      zoneList = await Zone.findAll(
        {
          attributes: ["zone_name", "zone_id", "loc_id", "stream_live_license"],
          where: {
            cust_id: user.cust_id || cust_id,
            ...loc_obj
          },
          include: [
            {
              model: CustomerLocations,
              attributes: ['loc_id', 'loc_name']
            }
          ]
        },
        { transaction: t }
      );
    } else {
      zoneList = await Zone.findAll(
        {
          attributes: ["zone_name", "zone_id", "loc_id", "stream_live_license"],
          where: { user_id: userId },
          include: [
            {
              model: CustomerLocations,
              attributes: ['loc_id', 'loc_name']
            }
          ]
        },
        { transaction: t }
      );
    }

    return zoneList;
  },

  disableZone: async (params, t) => {
    const { ZonesInChild } = await connectToDatabase();
    let update;
    if (
      params?.scheduled_disable_date == "" ||
      params?.scheduled_disable_date == null
    ) {
      update = {
        scheduled_enable_date: null,
        scheduled_disable_date: null,
        disabled: "true",
      };
    } else {
      update = {
        scheduled_disable_date: params.scheduled_disable_date,
      };
    }

    let disableZone = await ZonesInChild.update(
      update,
      {
        where: {
          zone_child_id: params.zone_child_id,
        },
        returning: true,
      },
      { transaction: t }
    );

    return disableZone;
  },
  enableZone: async (params, t) => {
    const { ZonesInChild } = await connectToDatabase();
    let update;
    if (
      params?.scheduled_enable_date == "" ||
      params?.scheduled_enable_date == null
    ) {
      update = {
        scheduled_enable_date: null,
        scheduled_disable_date: null,
        disabled: "false",
      };
    } else {
      update = { scheduled_enable_date: params.scheduled_enable_date };
    }

    let enableZone = await ZonesInChild.update(
      update,
      {
        where: {
          zone_child_id: params.zone_child_id,
        },
      },
      { transaction: t }
    );

    return enableZone;
  },

  validateZone: async (zone_id, userCustId) => {
    try {
      const zone = await Zone.findOne({where: {zone_id: zone_id}, raw: true, plain: true});
      if (!zone) {
        return { valid: false, message: 'Zone:'+ zone_id +' not found.' };
      }
      if (zone.cust_id !== userCustId) {
        return { valid: false, message: 'Unauthorized access to zone:'+ zone_id};
      }
      return { valid: true, message: 'Zone is valid.' };
    } catch (error) {
      console.error('Error validating zone:', error);
      return { valid: false, message: 'Error validating zone.' };
    }
  }
};
