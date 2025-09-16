const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  /* Create new zone type */
  createZoneType: async (zoneTypeObj, t) => {
    const { ZoneType } = await connectToDatabase();
    zoneTypeObj.zone_type_id = uuidv4();
    let zoneTypeCreated = await ZoneType.create(zoneTypeObj, { transaction: t });

    return zoneTypeCreated !== undefined ? zoneTypeCreated.toJSON() : null;
  },

  /* Edit zone type details */
  editZoneType: async (params, t) => {
    const { ZoneType } = await connectToDatabase();
    let update = {};

    if (params?.zone_type) {
      update.zone_type = params.zone_type;
    }
    let updateZoneTypeDetails = await ZoneType.update(
      update,
      {
        where: { zone_type_id: params.zone_type_id },
      },
      { transaction: t }
    );    
    return updateZoneTypeDetails;
  },

  /* Delete Existing zone type */
  deleteZoneType: async (zoneId, t) => {
    const { ZoneType } = await connectToDatabase();

    let deletedZoneType = await ZoneType.destroy(
      {
        where: { zone_type_id: zoneId },
      },
      { transaction: t }
    );

    return deletedZoneType;
  },

  /* Fetch all the zone type details */
  getAllZoneTypeDetails: async (user, filter) => {
    const { ZoneType } = await connectToDatabase();
    let {
      pageNumber = 0, pageSize = 10, searchBy = "", all = false,
      cust_id = null,
    } = filter;

    let zoneTypes;

    if (all) {
      zoneTypes = await ZoneType.findAndCountAll(
        {
          where: {
            cust_id: user.cust_id || cust_id,
            [Sequelize.Op.or]: [
              {
                zone_type: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
            ],
          },
          attributes: ['zone_type_id', 'zone_type']
        }
      );
    } else {
      zoneTypes = await ZoneType.findAndCountAll(
        {
          where: {
            cust_id: user.cust_id || cust_id,
            [Sequelize.Op.or]: [
              {
                zone_type: {
                  [Sequelize.Op.like]: `%${searchBy}%`,
                },
              },
            ],
          },
          attributes: ['zone_type_id', 'zone_type'],
          limit: parseInt(pageSize),
          offset: parseInt(pageNumber * pageSize),
        }
      );
    }
    
    return {zoneTypes: zoneTypes.rows, count: zoneTypes.count};
  }
};
