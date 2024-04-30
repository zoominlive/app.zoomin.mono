const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const Users = require("../models/users");

module.exports = {
  getMaxLiveStramAvailable: async (custId, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.findOne(
      {
        raw: true,
        where: {
          cust_id: custId,
        },
      },
      { transaction: t }
    );

    return customer?.max_stream_live_license || null;
  },

  getMaxLiveStreamRoomAvailable: async (custId, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.findOne(
      {
        raw: true,
        where: {
          cust_id: custId,
        },
      },
      { transaction: t }
    );

    return customer?.max_stream_live_license_room || null;
  },

  getMaxLiveStreamRoomAvailable: async (custId, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.findOne(
      {
        raw: true,
        where: {
          cust_id: custId,
        },
      },
      { transaction: t }
    );

    return customer?.max_stream_live_license_room || null;
  },

  getRTMPTranscoderUrl: async (custId, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.findOne(
      {
        raw: true,
        where: {
          cust_id: custId,
        },
      },
      { transaction: t }
    );

    return customer.rtmp_transcoder_endpoint;
  },

  getTranscoderUrl: async (custId, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.findOne(
      {
        raw: true,
        where: {
          cust_id: custId,
        },
      },
      { transaction: t }
    );

    return customer?.transcoder_endpoint || null;
  },

  getCustomerDetails: async (custId, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.findOne(
      {
        raw: true,
        where: {
          cust_id: custId,
        },
      },
      { transaction: t }
    );

    return customer;
  },
  setAvailableCameras: async (custId, availableCameras, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.update(
      { available_cameras: availableCameras },
      {
        where: {
          cust_id: custId,
        },
      },
      { transaction: t }
    );

    return customer;
  },

  getAllCustomer: async (filter) => {
    const { Customers, CustomerLocations } = await connectToDatabase();
    let { pageNumber = 0, pageSize = 10, searchBy = "", all = false } = filter;
    let customers;
    if (all) {
      customers = await Customers.findAndCountAll({
        where: {
          [Sequelize.Op.or]: [
            {
              billing_contact_first: {
                [Sequelize.Op.like]: `%${searchBy}%`,
              },
            },
            {
              billing_contact_last: {
                [Sequelize.Op.like]: `%${searchBy}%`,
              },
            },
            {
              company_name: {
                [Sequelize.Op.like]: `%${searchBy}%`,
              },
            },
          ],
        },
        attributes: { exclude: ["updatedAt"] },
        // limit: parseInt(pageSize),
        // offset: parseInt(pageNumber * pageSize),
      });
    } else {
      customers = await Customers.findAndCountAll({
        where: {
          [Sequelize.Op.or]: [
            {
              billing_contact_first: {
                [Sequelize.Op.like]: `%${searchBy}%`,
              },
            },
            {
              billing_contact_last: {
                [Sequelize.Op.like]: `%${searchBy}%`,
              },
            },
            {
              company_name: {
                [Sequelize.Op.like]: `%${searchBy}%`,
              },
            },
          ],
        },
        include: [
          {
            model: CustomerLocations,
            as: "customer_locations",
            attributes: ["loc_name"],
          },
          {
            model: Users,
            attributes: ['first_name', 'last_name','role','location','stream_live_license', 'email', 'user_id'],
          }
        ],
        attributes: { exclude: ["updatedAt"] },
        limit: parseInt(pageSize),
        offset: parseInt(pageNumber * pageSize),
        order: [[{ model: Users }, 'created_at', 'ASC']]
      });
    }
    return { customers: customers.rows, count: customers.rows.length,  };
  },

  getAllLocations: async (filter) => {
    const { Customers, CustomerLocations } = await connectToDatabase();
    let { pageNumber = 0, pageSize = 10, searchBy = "", all = false, user, cust_id } = filter;
    let locations;
    let custDetails;
    console.log("user==>", user);
    if (all) {
      locations = await CustomerLocations.findAndCountAll({
        where: {
          cust_id: user.cust_id || cust_id,
          [Sequelize.Op.or]: [
            {
              loc_name: {
                [Sequelize.Op.like]: `%${searchBy}%`,
              },
            },
          ],
        },
        attributes: { exclude: ["createdAt", "updatedAt"] },
        // limit: parseInt(pageSize),
        // offset: parseInt(pageNumber * pageSize),
      });
    } else {
      locations = await CustomerLocations.findAndCountAll({
        where: {
          cust_id: user.cust_id || cust_id,
          [Sequelize.Op.or]: [
            {
              loc_name: {
                [Sequelize.Op.like]: `%${searchBy}%`,
              },
            },
          ],
        },
        attributes: { exclude: ["createdAt", "updatedAt"] },
        limit: parseInt(pageSize),
        offset: parseInt(pageNumber * pageSize),
      });
      custDetails = await Customers.findOne({
        where: {
          cust_id: user.cust_id || cust_id,
        },
      })
    }
    let activeLocations = await CustomerLocations.findAndCountAll({
      where: {
        cust_id: user.cust_id || cust_id,
        status: 1,
      },
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });
    return { 
      locations: locations.rows, 
      count: locations.count,
      activeLocations: activeLocations.count, 
      customer: custDetails  
    };
  },

  createCustomer: async (customerObj, t) => {
    const { Customers } = await connectToDatabase();
    customerObj.cust_id = uuidv4();

    let customerCreated = await Customers.create(customerObj, {
      transaction: t,
    });

    return customerCreated;
  },

  createTermsApproval: async (customerObj, t) => {
    const { CustomerTermsApproval } = await connectToDatabase();
    let termsApprovalCreated = await CustomerTermsApproval.create(customerObj, {
      transaction: t,
    });

    return termsApprovalCreated;
  },
  
  deleteCustomer: async (customerId, t) => {
    const { Customers } = await connectToDatabase();
    let deletedCustomer = await Customers.destroy(
      { where: { cust_id: customerId } },
      { transaction: t }
    );

    return deletedCustomer;
  },

  editCustomer: async (customerId, params, t) => {
    const { Customers } = await connectToDatabase();
    let update = { ...params };
    let updateCustomerProfile = await Customers.update(
      update,
      {
        where: { cust_id: customerId },
        transaction: t 
      },
    );

    if (updateCustomerProfile) {
      updateCustomerProfile = await Customers.findOne(
        { 
          where: { cust_id: customerId },
          transaction: t 
        },
      );
    }

    return updateCustomerProfile.toJSON();
  },

  getLocationDetails: async (custId) => {
    const { CustomerLocations } = await connectToDatabase();
    let availableLocations = await CustomerLocations.findAll({
      where: { cust_id: custId },
      raw: true,
    });

    return availableLocations;
  },

  getActiveLocationDetails: async (custId) => {
    const { CustomerLocations } = await connectToDatabase();
    let availableLocations = await CustomerLocations.findAll({
      where: { 
        cust_id: custId, 
        status: 1
      },
      raw: true,
    });

    return availableLocations;
  },

  createLocation: async (custId, locations, timezone, t) => {
    const { CustomerLocations } = await connectToDatabase();
    const zip = (locations, timezone) => locations.map((value, index) => [value, timezone[index]]);
    const locationsWithTimezone = zip(locations, timezone);

    let createLocations = await Promise.all(
      locationsWithTimezone.map(async ([loc, timezone]) => {
        const obj = { loc_name: loc, cust_id: custId, time_zone: timezone };
        // obj.loc_id = uuidv4();
        return CustomerLocations.create(obj, {
          transaction: t,
        });
      })
    );
    return createLocations;
  },

  deleteLocation: async (custId) => {
    const { CustomerLocations } = await connectToDatabase();
    let deletedLocations = await CustomerLocations.destroy({where: {cust_id: custId}});
    return deletedLocations
  },

  deleteCustomerLocation: async (loc_id) => {
    const { CustomerLocations } = await connectToDatabase();
    let deletedLocations = await CustomerLocations.destroy({where: {loc_id: loc_id}});
    return deletedLocations
  }
};
