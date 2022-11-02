const { Camera, Room, RecentViewers, Customers } = require('../models/index');

module.exports = {
  getTranscoderUrl: async (custId) => {
    let customer = await Customers.findOne({
      raw: true,
      where: {
        cust_id: custId
      }
    });

    return customer.transcoder_endpoint;
  },

  getCustomerDetails: async (custId) => {
    let customer = await Customers.findOne({
      raw: true,
      where: {
        cust_id: custId
      }
    });

    return customer;
  },
  setAvailableCameras: async (custId, availableCameras) => {
    let customer = await Customers.update(
      { available_cameras: availableCameras },
      {
        where: {
          cust_id: custId
        }
      }
    );

    return customer;
  }
};
