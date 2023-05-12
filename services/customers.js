const connectToDatabase = require("../models/index");
const Sequelize = require('sequelize');
const { v4: uuidv4 } = require("uuid");

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
    const { Customers } = await connectToDatabase();
    let { pageNumber = 0, pageSize = 10, searchBy = "" } = filter;

    let customers = await Customers.findAndCountAll({
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
      attributes: { exclude: ["createdAt", "updatedAt"] },
      limit: parseInt(pageSize),
      offset: parseInt(pageNumber * pageSize),
    });

    return { customers: customers.rows, count: customers.count };
  },

  createCustomer: async (customerObj, t) => {
    const { Customers } = await connectToDatabase();
    customerObj.cust_id = uuidv4();

    let customerCreated = await Customers.create(customerObj, { transaction: t });

    return customerCreated;
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
    let update =  {...params};
    let updateCustomerProfile = await Customers.update(
      update,
      {
        where: { cust_id: customerId },
      },
      { transaction: t }
    );

    if (updateCustomerProfile) {
      updateCustomerProfile = await Customers.findOne(
        { where: { cust_id: customerId } },
        { transaction: t }
      );
    }

    return updateCustomerProfile.toJSON();
  },
};
