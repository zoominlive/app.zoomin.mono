const CONSTANTS = require("../lib/constants");
const customerServices = require("../services/customers");
const userServices = require("../services/users");
const sequelize = require("../lib/database");
const _ = require("lodash");
const {
  sendEmailChangeMail, sendRegistrationMailforUser
} = require('../lib/ses-mail-sender');
const CustomerLocations = require("../models/customer_locations");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        all: req.query?.all,
      };

      const customersDetails = await customerServices.getAllCustomer(filter);
      res.status(200).json({
        IsSuccess: true,
        Data: customersDetails,
        Message: CONSTANTS.CUSTOMER_FOUND,
      });
      next();
    } catch (error) {
      res
        .status(500)
        .json({
          IsSuccess: false,
          error_log: error,
          Message: CONSTANTS.INTERNAL_SERVER_ERROR,
        });
      next(error);
    }
  },

  getAllCustomerLocations: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'"),
        pageCount: req.query?.pageCount,
        orderBy: req.query?.orderBy,
        all: req.query?.all,
        user: req.user,
        cust_id: req.query?.cust_id
      };

      const locationsDetails = await customerServices.getAllLocations(filter);
      res.status(200).json({
        IsSuccess: true,
        Data: locationsDetails,
        Message: CONSTANTS.LOCATION_FOUND,
      });
      next();
    } catch (error) {
      res
        .status(500)
        .json({
          IsSuccess: false,
          error_log: error,
          Message: CONSTANTS.INTERNAL_SERVER_ERROR,
        });
      next(error);
    }
  },

  getCustomerById: async (req, res, next) => {
    try {
      const cust_id = req.query?.id

      const custDetails = await customerServices.getCustomerDetails(cust_id);
      res.status(200).json({
        IsSuccess: true,
        Data: custDetails,
        Message: CONSTANTS.CUSTOMER_FOUND,
      });
      next();
    } catch (error) {
      res
        .status(500)
        .json({
          IsSuccess: false,
          error_log: error,
          Message: CONSTANTS.INTERNAL_SERVER_ERROR,
        });
      next(error);
    }
  },

  createCustomerLocations: async(req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const { user, customer_locations, time_zone } = params;

      let locations = customer_locations.flatMap((i) => i);
      let timezone = time_zone.flatMap((i) => i);
      console.log(user);
      console.log(locations);
      let addLocations = await customerServices.createLocation(
        user,
        locations,
        timezone,
        t
      );
      
      if (addLocations) {
        await res.status(201).json({
          IsSuccess: true,
          Data: { addLocations },
          Message: CONSTANTS.LOCATION_ADDED,
        });
      } else {
        res
          .status(400)
          .json({
            IsSuccess: true,
            Data: {},
            Message: CONSTANTS.LOCATION_ADD_FAILED,
          });
      }
      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message:
          error?.name === "SequelizeUniqueConstraintError"
            ? error.errors[0].message
            : CONSTANTS.INTERNAL_SERVER_ERROR,
      });
      next(error);
    }
  },

  createCustomer: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const { user, customer_locations, ...customeDetails } = params;
      let customer;
      
      // const productList = await stripe.products.list();
      // const productPriceIDs = productList.data.map((item) => item.default_price);
      // console.log('productPriceIDs-->', productPriceIDs);
      
      // async function createSubscriptions(customerId, priceIds) {
      //   try {
      //     // Create subscriptions for each product
      //     const subscriptions = await Promise.all(priceIds.map(priceId => {
      //       return stripe.subscriptions.create({
      //         customer: customerId,
      //         items: [{ price: priceId }], 
      //       });
      //     }));

      //     // Return an array of subscription objects
      //     return subscriptions;
      //   } catch (error) {
      //     console.error('Error creating subscriptions:', error);
      //     throw error;
      //   }
      // }
      // createSubscriptions(customer.id, productPriceIDs)
      //   .then((subscriptions) => {
      //     console.log("Subscriptions created:", subscriptions);
      //   })
      //   .catch((error) => {
      //     console.error("Failed to create subscriptions:", error);
      //   });
      let addCustomer = await customerServices.createCustomer(
        customeDetails,
        t
      );
      user.cust_id = addCustomer?.cust_id;
      user.is_verified = false;
      let addUser = await userServices.createUser(user, t);
      let userData = addUser?.toJSON();
      const token = await userServices.createPasswordToken(userData, true);
      const name = userData.first_name + ' ' + userData.last_name;
      const originalUrl = process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token + '&type=user';
      await sendRegistrationMailforUser(name, userData.email, originalUrl);

      let locations = customer_locations.flatMap((i) => i.loc_name);
      let addLocations = await customerServices.createLocation(
        addCustomer?.cust_id,
        locations,
        t
      );
      
      if (addCustomer && addUser && addLocations) {
        await res.status(201).json({
          IsSuccess: true,
          Data: { ..._.omit(addCustomer, ["cust_id"]), ...addLocations },
          Message: CONSTANTS.CUSTOMER_REGISTERED,
        });
        if(user.role === 'Admin') {
          customer = await stripe.customers.create({
            name: user.first_name +' '+ user.last_name,
            email: user.email,
          });
          await customerServices.editCustomer(addCustomer?.cust_id, {stripe_cust_id: customer.id}, t)
        }
      } else {
        res
          .status(400)
          .json({
            IsSuccess: true,
            Data: {},
            Message: CONSTANTS.CUSTOMER_REGISRATION_FAILED,
          });
      }
      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message:
          error?.name === "SequelizeUniqueConstraintError"
            ? error.errors[0].message
            : CONSTANTS.INTERNAL_SERVER_ERROR,
      });
      next(error);
    }
  },

  createCustomerTermsApproval: async(req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { cust_id, user_id, terms_agreed, user_fname, user_lname, user_email } = req.body;
      let addRecord = await customerServices.createTermsApproval(
        {
          cust_id: cust_id,
          user_id: user_id,
          terms_agreed: terms_agreed,
          user_fname: user_fname,
          user_lname: user_lname,
          user_email: user_email,
        }
      );
      if (addRecord) {
        await res.status(201).json({
          IsSuccess: true,
          Data: addRecord,
          Message: CONSTANTS.CUSTOMER_APPROVAL_CREATED,
        });
      }
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message:
          error?.name === "SequelizeUniqueConstraintError"
            ? error.errors[0].message
            : CONSTANTS.INTERNAL_SERVER_ERROR,
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
          .json({
            IsSuccess: true,
            Data: deleted,
            Message: CONSTANTS.CUSTOMER_DELETED,
          });
      } else {
        res
          .status(400)
          .json({
            IsSuccess: true,
            Data: {},
            Message: CONSTANTS.CUSTOMER_NOT_FOUND,
          });
      }
      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      res
        .status(500)
        .json({
          IsSuccess: false,
          error_log: error,
          Message: CONSTANTS.INTERNAL_SERVER_ERROR,
        });
      next(error);
    }
  },

  deleteCustomerLocation: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { loc_id } = req.body;

      let deleted = await customerServices.deleteCustomerLocation(loc_id, t);

      if (deleted) {
        res
          .status(200)
          .json({
            IsSuccess: true,
            Data: deleted,
            Message: CONSTANTS.LOCATION_DELETED,
          });
      } else {
        res
          .status(400)
          .json({
            IsSuccess: true,
            Data: {},
            Message: CONSTANTS.CUSTOMER_NOT_FOUND,
          });
      }
      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      res
        .status(500)
        .json({
          IsSuccess: false,
          error_log: error,
          Message: CONSTANTS.INTERNAL_SERVER_ERROR,
        });
      next(error);
    }
  },

  updateCustomerLocation: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const { loc_id, loc_name, time_zone, status } = params;
      console.log('loc_id', loc_id);
      console.log('loc_name', loc_name);
      let update = {
        loc_name: loc_name,
        time_zone: time_zone,
        status: status
      };

      let updateLocation = await CustomerLocations.update(
        update,
        {
          where: { loc_id: loc_id },
        },
        { transaction: t }
      );
  
      if (updateLocation) {
        updateLocation = await CustomerLocations.findOne(
          { where: { loc_id: loc_id } },
          { transaction: t }
        );
        res.status(200).json({
          IsSuccess: true,
          Data: updateLocation.toJSON(),
          Message: CONSTANTS.LOCATION_EDITED,
        });
        await t.commit();
        next();
      } else {
        res
          .status(400)
          .json({
            IsSuccess: true,
            Data: {},
            Message: CONSTANTS.CUSTOMER_NOT_FOUND,
          });
      }
    } catch (error) {
      await t.rollback();
      res
        .status(500)
        .json({
          IsSuccess: false,
          error_log: error,
          Message: CONSTANTS.INTERNAL_SERVER_ERROR,
        });
      next(error);
    }
  },

  updateCustomerProfile: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const { user, customer_locations, ...customeDetails } = params;
      let editedProfile = await customerServices.editCustomer(
        customeDetails.cust_id,
        _.omit(customeDetails, ["cust_id"]),
        t
      );

      const userDetails = await userServices.getUserById(user.user_id, t);

      let editedUser = await userServices.editUserProfile(
        userDetails,
        _.omit(user, ["email"]),
        t
      );

      if (user?.email && user?.email !== userDetails.email) {
        const newEmail = user.email;
        const emailExist = await userServices.getUser(newEmail, t);
        if (emailExist) {
          res.status(409).json({
            IsSuccess: true,
            Data: {},
            Message: CONSTANTS.PROFILE_UPDATED_EMAIL_ALREADY_EXIST,
          });
          return
        } else {
          const token = await userServices.createEmailToken(user, newEmail);
          const name = user.first_name + " " + user.last_name;
          const originalUrl =
            process.env.FE_SITE_BASE_URL +
            "email-change?" +
            "token=" +
            token +
            "&type=user";

          await sendEmailChangeMail(name, user?.email, originalUrl);
        }
      }
      await customerServices.deleteLocation(customeDetails?.cust_id);

      let locations = customer_locations.flatMap((i) => i.loc_name);
      await customerServices.createLocation(
        customeDetails?.cust_id,
        locations,
        t
      );

      if (editedProfile && editedUser) {
        res.status(200).json({
          IsSuccess: true,
          Data: editedProfile,
          Message: CONSTANTS.CUSTOMER_EDITED,
        });
      } else {
        res
          .status(400)
          .json({
            IsSuccess: true,
            Data: {},
            Message: CONSTANTS.CUSTOMER_NOT_FOUND,
          });
      }
      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      res
        .status(500)
        .json({
          IsSuccess: false,
          error_log: error,
          Message: CONSTANTS.INTERNAL_SERVER_ERROR,
        });
      next(error);
    }
  },

  getLocationDetails: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.query;
      let locations = await customerServices.getLocationDetails(
        params.cust_id,
        t
      );
      res.status(200).json({
        IsSuccess: true,
        Data: locations,
        Message: CONSTANTS.CUSTOMER_LOCATIONS_DETAILS,
      });
      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      res
        .status(500)
        .json({
          IsSuccess: false,
          error_log: error,
          Message: CONSTANTS.INTERNAL_SERVER_ERROR,
        });
      next(error);
    }
  },
};
