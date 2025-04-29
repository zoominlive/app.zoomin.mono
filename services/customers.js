const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const Users = require("../models/users");
const axios = require("axios");
const CustomerLocations = require("../models/customer_locations");

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

  getPermitAudio: async (custId, t) => {
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

    return customer?.permit_audio || null;
  },

  getMaxRecordTime: async (custId, t) => {
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

    return customer?.max_record_time || null;
  },

  getCameraRecording: async (custId, t) => {
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

    return customer?.camera_recording || null;
  },

  getMaxResolution: async (custId, t) => {
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

    return customer?.max_resolution || null;
  },

  getMaxFileSize: async (custId, t) => {
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

    return customer?.max_file_size || null;
  },

  getMaxFps: async (custId, t) => {
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

    return customer?.max_fps || null;
  },

  getInviteUser: async (custId, t) => {
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

    return customer?.invite_user || null;
  },

  getMaxLiveStreamZoneAvailable: async (custId, t) => {
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

    return customer?.max_stream_live_license_zone || null;
  },

  getMaxLiveStreamZoneAvailable: async (custId, t) => {
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

    return customer?.max_stream_live_license_zone || null;
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

  getTranscoderUrlFromCustLocations: async (loc) => {
    try {      
      const { CustomerLocations } = await connectToDatabase();      
      let customer_locations = await CustomerLocations.findOne(
        {
          raw: true,
          where: {
            loc_id: loc
          },
        }
      );
  
      return customer_locations?.transcoder_endpoint || null;
    } catch (error) {
      console.log('error==>', error);
    }
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
            attributes: ["loc_name", "transcoder_endpoint", "loc_id"],
          },
          {
            model: Users,
            attributes: ['first_name', 'last_name','role','stream_live_license', 'email', 'user_id'],
            include: [
              {
                model: CustomerLocations,
                as: 'locations',
                attributes: ["loc_name", "loc_id"],
              }
            ]
          }
        ],
        distinct: true,
        attributes: { exclude: ["updatedAt"] },
        limit: parseInt(pageSize),
        offset: parseInt(pageNumber * pageSize),
        order: [[{ model: Users }, 'created_at', 'ASC']]
      });
    }
    return { customers: customers.rows, count: customers.count,  };
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
    console.log('locations==>', locations);
    
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

  deleteFrontEggTenant: async(tenantId) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId:process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      },
    );
    console.log('vendor_token-->', vendor_token);
    const tenant_response = await axios.delete(
      `${process.env.FRONTEGG_API_GATEWAY_URL}tenants/resources/tenants/v1/${tenantId}`,
      {
        headers: {
          'Authorization':
            `Bearer ${vendor_token.data.token}`,
        },
      }
    );
    return tenant_response;
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
        const obj = { loc_name: loc.loc_name, transcoder_endpoint: loc.transcoder_endpoint, cust_id: custId, time_zone: timezone };
        // obj.loc_id = uuidv4();
        return CustomerLocations.create(obj, {
          transaction: t,
        });
      })
    );
    return createLocations;
  },

  createNewLocation: async (custId, user_id, locations, timezone, api_key_id = null, t) => {
    const { CustomerLocations, CustomerLocationAssignments } = await connectToDatabase();
    const zip = (locations, timezone) => locations.map((value, index) => [value, timezone[index]]);
    const locationsWithTimezone = zip(locations, timezone);
    let locationCreated;
    let createLocations = await Promise.all(
      locationsWithTimezone.map(async ([loc, timezone]) => {
        const obj = { loc_name: loc, cust_id: custId, time_zone: timezone };
        // obj.loc_id = uuidv4();
        locationCreated = await CustomerLocations.create(obj, {
          transaction: t,
        });
        
        const userObj = { loc_id: locationCreated.dataValues.loc_id, cust_id: custId, user_id: user_id, api_key_id: api_key_id };
        await CustomerLocationAssignments.create(userObj, {
          transaction: t
        })
      })
    );
    return locationCreated;
  },

  deleteLocation: async (custId) => {
    const { CustomerLocations } = await connectToDatabase();
    let deletedLocations = await CustomerLocations.destroy({where: {cust_id: custId}});
    return deletedLocations
  },

  deleteSpecificLocations: async (loc_id) => {
    const { CustomerLocations } = await connectToDatabase();
    let deletedLocations = await CustomerLocations.destroy({where: {loc_id: loc_id}});
    return deletedLocations
  },

  updateSpecificLocations: async (locations) => {
    const { CustomerLocations } = await connectToDatabase();
    let updatedLocations = await Promise.all(
      locations.map((location) =>
        CustomerLocations.update(
          {
            loc_name: location.loc_name,
            transcoder_endpoint: location.transcoder_endpoint,
          },
          { where: { loc_id: location.loc_id } }
        )
      )
    );
    return updatedLocations
  },

  deleteCustomerLocation: async (loc_id, user_id) => {
    const { CustomerLocations, CustomerLocationAssignments } = await connectToDatabase();
    let deletedLocations = await CustomerLocations.destroy({where: {loc_id: loc_id}});
    let deletedUserLocation = await CustomerLocationAssignments.destroy({
      where: { [Sequelize.Op.and]: [{ user_id: user_id }, { loc_id: loc_id }] },
    });
    return { deletedLocations, deletedUserLocation };
  },

  validateLocation: async (loc, userLocations) => {
    try {
      const custLocation = await CustomerLocations.findOne({where: {loc_id: loc}, raw: true, plain: true});
      if (!custLocation) {
        return { valid: false, message: 'Location:'+ loc +' not found.' };
      }
      if (!userLocations.includes(loc)) {
        return { valid: false, message: 'Unauthorized access to location:'+ loc};
      }
      return { valid: true, message: 'Location is valid.' };
    } catch (error) {
      console.error('Error validating location:', error);
      return { valid: false, message: 'Error validating location.' };
    }
  },
};
