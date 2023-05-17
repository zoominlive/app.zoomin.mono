const CONSTANTS = require('../lib/constants');
const customerServices = require('../services/customers');
const sequelize = require('../lib/database');
const _ = require("lodash");

module.exports = {
/* Get  customer's details */
getAllCustomerDetails: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'"),
        pageCount: req.query?.pageCount,
        orderBy: req.query?.orderBy,
        all: req.query?.all
      };

      const customersDetails = await customerServices.getAllCustomer(filter);
      res.status(200).json({
        IsSuccess: true,
        Data: customersDetails,
        Message: CONSTANTS.CUSTOMER_FOUND
      });
      next();
    } catch (error) {
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  createCustomer: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
   
  
      let addCustomer = await customerServices.createCustomer(params, t);
      
      if (addCustomer) {
      
        res.status(201).json({
          IsSuccess: true,
          Data: _.omit(addCustomer, ['cust_id']),
          Message: CONSTANTS.CUSTOMER_REGISTERED
        });
      } else {
        res
          .status(400)
          .json({ IsSuccess: true, Data: {}, Message: CONSTANTS.CUSTOMER_REGISRATION_FAILED });
      }
      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

    deleteCustomer: async (req, res, next) => {
      const t = await sequelize.transaction();
      try {
        const { customerId } = req.body;
  
        let deleted = await customerServices.deleteCustomer(customerId, t);
  
        if (deleted) {
          res
            .status(200)
            .json({ IsSuccess: true, Data: deleted, Message: CONSTANTS.CUSTOMER_DELETED });
        } else {
          res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.CUSTOMER_NOT_FOUND });
        }
        await t.commit();
        next();
      } catch (error) {
        await t.rollback();
        res
          .status(500)
          .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
        next(error);
      }
    },
    updateCustomerProfile: async (req, res, next) => {
      const t = await sequelize.transaction();
      try {
        const params = req.body;
        let editedProfile = await customerServices.editCustomer(params.cust_id, _.omit(params, ['cust_id']), t);
  
        if (editedProfile) {
          res.status(200).json({
            IsSuccess: true,
            Data: editedProfile,
            Message: CONSTANTS.CUSTOMER_EDITED
          });
        } else {
          res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.CUSTOMER_NOT_FOUND });
        }
        await t.commit();
        next();
      } catch (error) {
        await t.rollback();
        res
          .status(500)
          .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
        next(error);
      }
    },

    getLocationDetails: async(req, res, next) => {
      const t = await sequelize.transaction();
      try {
        const params = req.query;
        let locations = await customerServices.getLocationDetails(params.cust_id, t);
          res.status(200).json({
            IsSuccess: true,
            Data: locations,
            Message: CONSTANTS.CUSTOMER_LOCATIONS_DETAILS
          });
        await t.commit();
        next();
      } catch (error) {
        await t.rollback();
        res
          .status(500)
          .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
        next(error);
      }
    }
}