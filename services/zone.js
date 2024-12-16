const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  /* Create new zone */
  createZone: async (zoneObj, t) => {
    const { Zone } = await connectToDatabase();
    zoneObj.zone_id = uuidv4();
    let zoneCreated = await Zone.create(zoneObj, { transaction: t });

    return zoneCreated !== undefined ? zoneCreated.toJSON() : null;
  },

  /* Edit zone details */
  editZone: async (params, t) => {
    const { Zone } = await connectToDatabase();
    let update = {};

    if (params?.zone_name) {
      update.zone_name = params.zone_name;
    }
    let updateZoneDetails = await Zone.update(
      update,
      {
        where: { zone_id: params.zone_id },
      },
      { transaction: t }
    );
    console.log('updateZoneDetails==>', updateZoneDetails);
    
    return updateZoneDetails;
  },

  /* Delete Existing zone */
  deleteZone: async (zoneId, t) => {
    const { Zone } = await connectToDatabase();

    let deletedZone = await Zone.destroy(
      {
        where: { zone_id: zoneId },
      },
      { transaction: t }
    );

    return deletedZone;
  },

  /* Fetch all the zone's details */
  getAllZoneDetails: async (user, filter) => {
    const { Zone } = await connectToDatabase();
    let {
      pageNumber = 0, pageSize = 10, searchBy = "", all = false,
      cust_id = null,
    } = filter;

    let zones;

    if (all) {
      zones = await Zone.findAndCountAll(
        {
          where: {
            cust_id: user.cust_id || cust_id,
            [Sequelize.Op.or]: [
              {
                zone_name: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
            ],
          },
          attributes: ['zone_id', 'zone_name']
        }
      );
    } else {
      zones = await Zone.findAndCountAll(
        {
          where: {
            cust_id: user.cust_id || cust_id,
            [Sequelize.Op.or]: [
              {
                zone_name: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
            ],
          },
          attributes: ['zone_id', 'zone_name'],
          limit: parseInt(pageSize),
          offset: parseInt(pageNumber * pageSize),
        }
      );
    }
    
    return {zones: zones.rows, count: zones.count};
  }
};
