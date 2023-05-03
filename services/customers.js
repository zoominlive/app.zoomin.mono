const connectToDatabase = require('../models/index');

module.exports = {
  getMaxLiveStramAvailable: async (custId, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.findOne(
      {
        raw: true,
        where: {
          cust_id: custId
        }
      },
      { transaction: t }
    );

    return customer.max_stream_live_license;
  },

  getRTMPTranscoderUrl: async (custId, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.findOne(
      {
        raw: true,
        where: {
          cust_id: custId
        }
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
          cust_id: custId
        }
      },
      { transaction: t }
    );

    return customer.transcoder_endpoint;
  },

  getCustomerDetails: async (custId, t) => {
    const { Customers } = await connectToDatabase();
    let customer = await Customers.findOne(
      {
        raw: true,
        where: {
          cust_id: custId
        }
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
          cust_id: custId
        }
      },
      { transaction: t }
    );

    return customer;
  }
};
