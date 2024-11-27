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
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Users = require("../models/users");
const connectToDatabase = require("../models/index");

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
      const cust_id = req.user.cust_id;
      const user_id = req.user.user_id;
      const { user, customer_locations, time_zone } = params;

      let locations = customer_locations.flatMap((i) => i);
      let timezone = time_zone.flatMap((i) => i);
      console.log(user);
      console.log(locations);
      let api_key_id;
      if(req.user.key && req.user.key !== undefined && req.user.key !== null) api_key_id = req.user.id;
      let addLocations = await customerServices.createNewLocation(
        user || cust_id,
        user_id,
        locations,
        timezone,
        api_key_id,
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
    
      let addCustomer = await customerServices.createCustomer(customeDetails, t);
      if (!addCustomer) {
        return res.status(400).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.CUSTOMER_REGISTRATION_FAILED,
        });
      }
      user.cust_id = addCustomer?.cust_id;
      user.is_verified = false;

      let locations = customer_locations.flatMap((i) => {return { loc_name: i.loc_name, transcoder_endpoint: i.transcoder_endpoint}});
      console.log('locations==>', locations);
      let addLocations = await customerServices.createLocation(
        addCustomer?.cust_id,
        locations,
        t
      );
      if (!addLocations) {
        return res.status(400).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.CUSTOMER_REGISTRATION_FAILED,
        });
      }
      console.log("addLocations=========>", addLocations);
      user.location.locations = addLocations.map((item) => item.dataValues);

      let addUser = await userServices.createUser(user, t);
      if (!addUser) {
        return res.status(400).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.CUSTOMER_REGISTRATION_FAILED,
        });
      }
      let userData = addUser?.toJSON();
      const token = await userServices.createPasswordToken(userData, true);
      const name = userData.first_name + ' ' + userData.last_name;
      const originalUrl = process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token + '&type=user';
      // await sendRegistrationMailforUser(name, userData.email, originalUrl);

      // let locations = customer_locations.flatMap((i) => {return { loc_name: i.loc_name, transcoder_endpoint: i.transcoder_endpoint}});
      // console.log('locations==>', locations);
      // let addLocations = await customerServices.createLocation(
      //   addCustomer?.cust_id,
      //   locations,
      //   t
      // );
      // if (!addLocations) {
      //   return res.status(400).json({
      //     IsSuccess: true,
      //     Data: {},
      //     Message: CONSTANTS.CUSTOMER_REGISTRATION_FAILED,
      //   });
      // }
      // console.log("addLocations=========>", addLocations);

      if (user.role === 'Admin') {
        const vendor_token = await axios.post(
          `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
          {
            clientId:process.env.FRONTEGG_CLIENT_ID,
            secret: process.env.FRONTEGG_API_KEY,
          },
        );
        console.log('vendor_token-->', vendor_token);
        const tenant_response = await axios.post(
          `${process.env.FRONTEGG_API_GATEWAY_URL}tenants/resources/tenants/v1`,
          {
            tenantId: uuidv4(),
            name: customeDetails.company_name,
          },
          {
            headers: {
              'Authorization':
                `Bearer ${vendor_token.data.token}`,
            },
          }
        );
        console.log('tenant_response--->', tenant_response.data);
        if (tenant_response) {
          const user_response = await axios.post(
            `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/users/v1`,
            {
              name: customeDetails.billing_contact_first +' '+ customeDetails.billing_contact_last,
              email: addUser.dataValues.email,
              metadata: JSON.stringify({
                zoomin_user_id: addUser.dataValues.user_id
              })
            },
            {
              headers: {
                'frontegg-tenant-id': `${tenant_response.data.tenantId}`,
                'Authorization':
                  `Bearer ${vendor_token.data.token}`                
              },
            }
          );
          console.log('user_response--->', user_response.data);
          await Users.update(
            { frontegg_tenant_id: tenant_response.data.tenantId, frontegg_user_id: user_response.id },
            {
              where: { user_id: addUser.dataValues.user_id },
              transaction: t 
            },
          );
        }
        customer = await stripe.customers.create({
          name: user.first_name +' '+ user.last_name,
          email: user.email,
          address: {
            city: customeDetails?.city,
            country: customeDetails?.country,
            line1: customeDetails?.address_1,
            line2: customeDetails?.address_2,
            postal_code: customeDetails?.postal,
          }
        });
        await customerServices.editCustomer(addCustomer?.cust_id, {stripe_cust_id: customer.id, frontegg_tenant_id: tenant_response.data.tenantId}, t)
      }
      await t.commit();
      res.status(201).json({
        IsSuccess: true,
        Data: { ..._.omit(addCustomer, ["cust_id"]), ...addLocations },
        Message: CONSTANTS.CUSTOMER_REGISTERED,
      });
        
      next();
    } catch (error) {
      await t.rollback();
      console.error(error);
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
      const { customerId, confirmationText } = req.body;
      let customer = await customerServices.getCustomerDetails(customerId);
      
      // Check if the confirmation text matches "DELETE <CUSTOMER_NAME>"
      const expectedText = `DELETE ${customer.company_name}`;
      if (confirmationText !== expectedText) {
        await t.rollback();
        return res.status(400).json({ Message: `Incorrect confirmation text. Expected: "DELETE ${customer.company_name}"` });
      }
      const deleteFrontEggTenant = await customerServices.deleteFrontEggTenant(customer.frontegg_tenant_id);
      let deleted;
      if(deleteFrontEggTenant.status == 200) {
        deleted = await customerServices.deleteCustomer(customerId, t);
      }
      if (deleted) {
        res
          .status(200)
          .json({
            IsSuccess: true,
            Data: deleted,
            Message: CONSTANTS.CUSTOMER_DELETED,
          });
      } else {
        await t.rollback();
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
      const { CustomerLocations } = await connectToDatabase();
      const locationDetails = await CustomerLocations.findOne({where: { loc_id: loc_id }, raw: true, plain: true});
      let deleted;      
      if (locationDetails.cust_id !== req.user?.cust_id) {
        await t.rollback();
        return res
          .status(404)
          .json({
            IsSuccess: false,
            Data: {},
            Message: CONSTANTS.CUSTOMER_NOT_FOUND,
          });
      } else {
        deleted = await customerServices.deleteCustomerLocation(loc_id, req.user.user_id);
      }

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
            Message: CONSTANTS.LOCATION_NOT_FOUND,
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
      const { CustomerLocations } = await connectToDatabase();
      const locationDetails = await CustomerLocations.findOne({where: { loc_id: loc_id }, raw: true, plain: true});
      console.log('loc_id', loc_id);
      console.log('loc_name', loc_name);
      let update = {
        loc_name: loc_name,
        time_zone: time_zone,
        status: status
      };
      if (locationDetails.cust_id !== req.user?.cust_id) {
        await t.rollback();
        return res.status(404).json({
          IsSuccess: false,
          Data: {},
          Message: CONSTANTS.CUSTOMER_NOT_FOUND,
        });
      }
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
      console.log('user=>', user);
      await customerServices.deleteLocation(customeDetails?.cust_id);
      console.log(customer_locations);
      let locations = customer_locations.flatMap((i) => {return { loc_name: i.loc_name, transcoder_endpoint: i.transcoder_endpoint}});
      console.log('locations-->', locations);
      let newLocations = await customerServices.createLocation(
        customeDetails?.cust_id,
        locations,
        t
      );
      if (customer_locations.length !== user.location.locations.length) {
        user.location.locations = newLocations.map((item) => item.dataValues).filter((customerLocation) => !user.location.locations.some(
          (location) => location.loc_name !== customerLocation.loc_name
        ));  
      } else {
        user.location.locations = newLocations.map((item) => item.dataValues);
      }
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
      // await customerServices.deleteLocation(customeDetails?.cust_id);
      // console.log(customer_locations);
      // let locations = customer_locations.flatMap((i) => {return { loc_name: i.loc_name, transcoder_endpoint: i.transcoder_endpoint}});
      // console.log('locations-->', locations);
      // await customerServices.createLocation(
      //   customeDetails?.cust_id,
      //   locations,
      //   t
      // );

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
        params.cust_id || req.user.cust_id,
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
