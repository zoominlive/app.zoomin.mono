const _ = require('lodash');
const familyServices = require('../services/families');
const childServices = require('../services/children');
const userServices = require('../services/users');
const logServices = require('../services/logs');
const dashboardServices = require('../services/dashboard');
const CONSTANTS = require('../lib/constants');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: false });
const { sequelize } = require('../lib/database');
var bcrypt = require('bcryptjs');
const {
  sendRegistrationMailforFamilyMember,
  sendEmailChangeMail
} = require('../lib/ses-mail-sender');
const { v4: uuidv4 } = require('uuid');
const customerServices = require('../services/customers');
const Family = require('../models/family');

module.exports = {
  // create new family(primary parent, secondary parent ,child)
  createFamily: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      let { primary, secondary, children, cust_id = null, tenant_id } = req.body;
      const userId = req.user.user_id;
      const custId = req.user.cust_id || cust_id;
      const fronteggTenantId = tenant_id || req.user.frontegg_tenant_id;

      //add primary parent

      let allLocations = [];
      children?.forEach((child) => {
        child?.location?.locations?.forEach((loc) => {
          allLocations.push(loc);
        });
      });

      allLocations = _.uniq(allLocations);

      primary.location = allLocations;
      const newFamilyId = await familyServices.generateNewFamilyId();
      primary.family_id = newFamilyId;
      const emailExist = await userServices.checkEmailExist(primary.email);
      if (emailExist) {
        throw new Error("Validation error");
      }
      const familyLocation = allLocations.map((item) => item.loc_id);
      if (!familyLocation.every(location => req.user.locations.map((item) => item.loc_id).includes(location)) && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized location access"});
      }
      let primaryParent = await familyServices.createFamily(
        {
          ...primary,
          family_member_id: uuidv4(),
          family_id: uuidv4(),
          user_id: userId,
          cust_id: custId,
          frontegg_tenant_id: fronteggTenantId
        },
        t
      );

      const familyId = primaryParent.family_id;

      //add secondary parent

      let secondaryParents = '';
      let familyObj = [];

      secondary?.forEach(async (family) => {
        family.location = allLocations;

        familyObj.push({
          ...family,
          family_member_id: uuidv4(),
          family_id: uuidv4(),
          user_id: userId,
          cust_id: custId,
          family_id: familyId,
          frontegg_tenant_id: fronteggTenantId
        });
      });
      secondaryParents = await familyServices.createFamilies(familyObj, t);

      if (primaryParent && secondaryParents) {
        const token = await familyServices.createPasswordToken(primaryParent);
        const name = primaryParent.first_name + ' ' + primaryParent.last_name;
        const originalUrl =
          process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token;
        // const short_url = await TinyURL.shorten(originalUrl);

        // await sendRegistrationMailforFamilyMember(name, primaryParent.email, originalUrl);

        if (!_.isEmpty(secondaryParents)) {
          secondaryParents.forEach(async (secondaryParent) => {
            const token = await familyServices.createPasswordToken(secondaryParent);
            const name = secondaryParent.first_name + ' ' + secondaryParent.last_name;
            const originalUrl =
              process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token;
            // const short_url = await TinyURL.shorten(originalUrl);

            await sendRegistrationMailforFamilyMember(name, secondaryParent.email, originalUrl);
          });
        }
      }

      //add children

      childServices;
      let childObjs = [];

      children?.forEach(async (child) => {
        childObjs.push({
          ...child,
          zones: { zones: child.zones },
          family_id: familyId,
          cust_id: custId
        });
      });

      children = await childServices.createChildren(childObjs, t);
      if(primaryParent) {
        const { frontegg_tenant_id } = await customerServices.getCustomerDetails(custId);
        primaryParent.roleIds = 'f9298849-ecce-473a-9e1d-5cd156ceb93e';
        const createFrontEggUser = await userServices.createFrontEggFamilyUser(frontegg_tenant_id, primaryParent)
        if (createFrontEggUser) {
          await Family.update(
            { frontegg_user_id: createFrontEggUser.id },
            {
              where: { family_member_id: primaryParent.family_member_id },
              transaction: t 
            }
          );
        }
      }
      if(secondaryParents.length !== 0) {
        const { frontegg_tenant_id } = await customerServices.getCustomerDetails(custId);
        for (const item of secondaryParents) {
          item.dataValues.roleIds = 'f9298849-ecce-473a-9e1d-5cd156ceb93e';
          const createFrontEggUser = await userServices.createFrontEggFamilyUser(frontegg_tenant_id, item.dataValues)
          if (createFrontEggUser) {
            await Family.update(
              { frontegg_user_id: createFrontEggUser.id },
              {
                where: { family_member_id: item.dataValues.family_member_id },
                transaction: t 
              }
            );
          }
        }
      }
      //await dashboardServices.updateDashboardData(custId);
      await t.commit();
      
      res.status(201).json({
        IsSuccess: true,
        Data: { 
          primaryParent: _.omit(primaryParent, ['password_link', 'is_verified', 'disabled_locations', 'roleIds', 'frontegg_tenant_id']), 
          secondaryParents: _.map(secondaryParents, ({dataValues}) => 
            _.omit(dataValues, ['password_link', 'is_verified', 'disabled_locations', 'roleIds', 'frontegg_tenant_id'])
          ), 
          children 
        },
        Message: CONSTANTS.FAMILY_CREATED
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message:
          error.message === 'Validation error'
            ? CONSTANTS.EMAIL_EXIST
            : CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = [
        {
          user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
          function: 'Primary_Family',
          function_type: 'Add',
          request: req?.body?.primary
        }
      ];

      req?.body?.secondary?.forEach((secMember) =>
        logObj.push({
          user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
          function: 'Second_Family',
          function_type: 'Add',
          request: secMember
        })
      );

      req?.body?.children?.forEach((child) =>
        logObj.push({
          user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
          function: 'Child',
          function_type: 'Add',
          request: child
        })
      );

      try {
        await logServices.bulkAddChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  // edit family member details
  editFamily: async (req, res, next) => {
    const t = await sequelize.transaction();
    let familyMember;
    try {
      const params = req.body;
      let emailExist = false;
      familyMember = await familyServices.getFamilyMemberById(params.family_member_id, t);

      // Validate customer of requested user and family
      if (familyMember.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to family user:"+ params.family_member_id})
      }
      if(params.inviteFamily) {
        try {
          const token = await familyServices.createPasswordToken(familyMember);
          const name = familyMember?.first_name + ' ' + familyMember?.last_name;
          const originalUrl = process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token;
          await sendRegistrationMailforFamilyMember(name, familyMember.email, originalUrl);
          res.status(200).json({
            IsSuccess: true,
            Message: CONSTANTS.RESEND_INVITE
          });
          await t.commit(); // Commit the transaction after successful response
          return; // Return to exit the function after sending the response
        } catch (error) {
          console.log(error);
        }
      }

      if (params.email !== familyMember.email) {
        emailExist = await userServices.checkEmailExist(params.email, t);
      }

      if (emailExist) {
        res.status(409).json({
          IsSuccess: false,
          Data: {},
          Message: CONSTANTS.EMAIL_EXIST
        });
        await t.rollback(); // Rollback the transaction after sending the response
        return; // Return to exit the function after sending the response
      }
  
      params.is_verified = familyMember.email != params.email ? false : true;
      let editedFamily;
      if (params.is_verified) {
        editedFamily = await familyServices.editFamily(params, t);
      } else {
        editedFamily = await familyServices.editFamily(_.omit(params, ['email']), t);
      }
  
      if (!params.is_verified) {
        const token = await familyServices.createEmailToken(editedFamily, params.email);
        const name = editedFamily.first_name + ' ' + editedFamily.last_name;
        const originalUrl = process.env.FE_SITE_BASE_URL + 'email-change?' + 'token=' + token + '&type=family';
        const response = await sendEmailChangeMail(name, params?.email, originalUrl);
      }
  
      await t.commit(); // Commit the transaction after successful update
      if (editedFamily) {
        res.status(200).json({
          IsSuccess: true,
          Data: _.omit(editedFamily.dataValues, ['password_link', 'password', 'is_verified', 'disabled_locations', 'frontegg_user_id', 'frontegg_tenant_id']),
          Message: CONSTANTS.FAMILY_UPDATED +
            '. ' +
            ` ${params.is_verified ? '' : CONSTANTS.VERIFY_UPDATED_EMAIL}`
        });
      } else {
        res.status(404).json({
          IsSuccess: false,
          Data: {},
          Message: CONSTANTS.FAMILY_MEMBER_NOT_FOUND
        });
      }

      next();
    } catch (error) {
      await t.rollback(); // Rollback the transaction in case of an error
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message:
          error.message === 'Validation error'
            ? CONSTANTS.EMAIL_EXIST
            : CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: familyMember?.family_member_id ? familyMember?.family_member_id : 'Not Found',
        function: familyMember?.member_type == 'primary' ? 'Primary_Family' : 'Second_Family',
        function_type: 'Edit',
        request: req?.body
      };

      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  // list family details for family list page.
  getAllFamilyDetails: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const filter = {
        pageNumber: parseInt(req.query?.page),
        pageSize: parseInt(req.query?.limit),
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'"),
        zonesList: req.query?.zones,
        location: req.query?.location,
        cust_id: req.query?.cust_id
      };
      
      let familyDetails = await familyServices.getAllFamilyDetails(req.user, filter, t);
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: familyDetails,
        Message: CONSTANTS.FAMILY_DETAILS + `${req.user.first_name}`
      });

      next();
    } catch (error) {
      await t.rollback();
      console.log(error);
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  // add new parent to existing family
  addParent: async (req, res, next) => {
    let member;
    const t = await sequelize.transaction();
    try {
      params = req.body;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      params.frontegg_tenant_id = req.body.tenant_id || req.user.frontegg_tenant_id;
      params.user_id = req.user.user_id;
      if (!params.location) params.location = req.user.locations;
      let emailExist = await userServices.checkEmailExist(params.email, t);

      if (emailExist) {
        res.status(409).json({
          IsSuccess: false,
          Data: {},
          Message: CONSTANTS.EMAIL_EXIST
        });
      } else {
        const parent = await familyServices.createFamily(params, t);
        member = parent;
        const token = await familyServices.createPasswordToken(parent);
        const name = parent.first_name + ' ' + parent.last_name;
        const originalUrl =
          process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token;
        // const short_url = await TinyURL.shorten(originalUrl);
        // await sendRegistrationMailforFamilyMember(name, parent.email, originalUrl);
        if(parent) {
          const { frontegg_tenant_id } = await customerServices.getCustomerDetails(params.cust_id);
          parent.roleIds = '8cd1581f-5401-40b9-b7ce-b8b746e58c0e';
          const createFrontEggUser = await userServices.createFrontEggFamilyUser(frontegg_tenant_id, parent)
          if (createFrontEggUser) {
            await Family.update(
              { frontegg_user_id: createFrontEggUser.id },
              {
                where: { family_member_id: parent.family_member_id },
                transaction: t 
              }
            );
          }
        }
        await t.commit();
        res.status(201).json({
          IsSuccess: true,
          Data: _.omit(parent, ['password_link', 'is_verified', 'disabled_locations', 'roleIds', 'frontegg_tenant_id']),
          Message: CONSTANTS.PARENT_ADDED
        });
      }

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: member?.family_member_id ? member?.family_member_id : 'Not Found',
        function: 'Second_Family',
        function_type: 'Add',
        request: req?.body
      };

      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  // delete family
  deleteFamily: async (req, res, next) => {
    const t = await sequelize.transaction();
    let familyDetails;
    let userDetails;
    try {
      params = req.body;
      familyDetails = await familyServices.getFamilyDetailsById(params.family_id, t);
      if (!familyDetails) {
        await t.rollback();
        return res.status(400).json({isSucces: false, Data: {}, Message: "Family not found"})
      }
      
      userDetails = await userServices.getUserById(req?.user?.user_id, t);
      // Validate customer of requested user and family
      if (familyDetails.dataValues.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to family user:"+ params.family_id})
      }
      let deleteFamily = await familyServices.deleteFamily(params.family_id, t);
      if (deleteFamily && params.frontegg_user_id !== null) {
        const frontEggUser = await userServices.removeFrontEggUser(params.frontegg_user_id || familyDetails?.dataValues.frontegg_user_id)
        if(familyDetails.dataValues.secondary.length !== 0) {
          for (const secondaryMemmber of familyDetails.dataValues.secondary) {
            await userServices.removeFrontEggUser(secondaryMemmber.dataValues?.frontegg_user_id);
          }
        }
      }
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: CONSTANTS.FAMILY_DELETED
      });

      next();
    } catch (error) {
      await t.rollback();
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Primary_Family',
        function_type: 'Delete',
        request: {
          Deleted_by: userDetails?.first_name + ' ' + userDetails?.last_name,
          Deleted_FamilyId: familyDetails?.dataValues?.family_id || req?.body,
          Deleted_Family_Member_Name: familyDetails?.dataValues?.first_name + ' ' + familyDetails?.dataValues?.last_name,
        }
      };

      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  // disable family member
  disableFamily: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      params = req.body;
      const familyDetails = await familyServices.getFamilyDetailsById(params.family_id, t);
      if (familyDetails.dataValues.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to family user:"+ params.family_id})
      }
      let disableFamily = await familyServices.disableFamily(
        params.family_member_id,
        params.member_type,
        params.family_id,
        params?.scheduled_end_date,
        params?.locations_to_disable,
        req.user,
        t
      );

      if (params?.scheduled_end_date) {
        res.status(200).json({
          IsSuccess: true,
          Data: { scheduled: true },
          Message: CONSTANTS.FAMILY_SCHEDULED
        });
      } else if(params?.member_type === "secondary") {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.FAMILY_MEMBER_DISABLED
        });
      } else {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.FAMILY_DISABLED
        });
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
    } finally {
      let logObj = {
        user_id: params?.family_member_id ? params?.family_member_id : 'Not Found',
        function: req?.body?.member_type == 'primary ' ? 'Primary_Family' : 'Second_Family',
        function_type: 'Disable',
        request: req?.body
      };

      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  // enable family member
  enableFamily: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      params = req.body;
      const familyDetails = await familyServices.getFamilyDetailsById(params.family_id, t);
      if (familyDetails.dataValues.cust_id !== req.user.cust_id && req.user.role !== 'Super Admin') {
        await t.rollback();
        return res.status(400).json({Message: "Unauthorized access to family user:"+ params.family_id})
      }
      let enableFamily = await familyServices.enableFamily(
        params.family_member_id,
        params.member_type,
        params.family_id,
        req.user,
        t
      );

      if (params.member_type === 'secondary') {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.FAMILY_MEMBER_ENABLED
        });
      } else {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.FAMILY_ENABLED
        });
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
    } finally {
      let logObj = {
        user_id: params?.family_member_id ? params?.family_member_id : 'Not Found',
        function: req?.body?.member_type == 'primary ' ? 'Primary_Family' : 'Second_Family',
        function_type: 'Enable',
        request: req?.body
      };

      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  /* verify email and set password */
  validateFamilyMember: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { token, password } = req.body;
      const decodeToken = engine.decrypt(token);
      if (decodeToken.familyMemberId) {
        let familyMember;

        familyMember = await familyServices.getFamilyMemberById(decodeToken.familyMemberId, t);

        if (familyMember) {
          if (!familyMember?.password) {
            const salt = await bcrypt.genSaltSync(10);
            let hashPassword = bcrypt.hashSync(password, salt);

            const setPassword = await familyServices.resetPassword(
              decodeToken.familyMemberId,
              hashPassword,
              t
            );

            await familyServices.editFamily(
              {
                family_member_id: familyMember.family_member_id,
                password_link: 'inactive'
              },
              t
            );
            res.status(200).json({
              IsSuccess: true,
              Data: {},
              Message: CONSTANTS.FAMILY_MEMBER_PASS_RESET
            });
          } else if (familyMember?.password) {
            if (familyMember.password === decodeToken?.password) {
              const salt = await bcrypt.genSaltSync(10);
              let hashPassword = bcrypt.hashSync(password, salt);
              const setPassword = await familyServices.resetPassword(
                decodeToken.familyMemberId,
                hashPassword,
                t
              );

              await familyServices.editFamily(
                {
                  family_member_id: familyMember.family_member_id,
                  password_link: 'inactive'
                },
                t
              );
              res.status(200).json({
                IsSuccess: true,
                Data: {},
                Message: CONSTANTS.FAMILY_MEMBER_PASS_RESET
              });
            } else {
              res.status(400).json({
                IsSuccess: false,
                Data: {},
                Message: CONSTANTS.PASSWORD_ALREADY_CHANGED
              });
            }
          } else {
            res.status(400).json({
              IsSuccess: false,
              Data: {},
              Message: CONSTANTS.INVALID_TOKEN
            });
          }
        } else {
          res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.LINK_EXPIRED });
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

  checkLinkValid: async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const decodeToken = engine.decrypt(token);

      if (decodeToken?.familyMemberId) {
        let user;

        user = await familyServices.getFamilyMemberById(decodeToken.familyMemberId);

        if (user) {
          if (user?.password_link === 'active') {
            res.status(200).json({ IsSuccess: true, Data: 'active', Message: 'Link is valid' });
          } else {
            res.status(400).json({
              IsSuccess: false,
              Data: 'inactive',
              Message: CONSTANTS.LINK_EXPIRED
            });
          }
        } else {
          res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.LINK_EXPIRED });
      }
      next();
    } catch (error) {
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  // change registered email and send verification mail
  changeRegisteredEmail: async (req, res, next) => {
    const t = await sequelize.transaction();
    let memberId;
    try {
      const { token } = req.body;
      const decodeToken = engine.decrypt(token);
      memberId = decodeToken?.familyMemberId;
      if (decodeToken?.familyMemberId) {
        const user = await familyServices.getFamilyMemberById(decodeToken.familyMemberId, t);

        if (user.email !== decodeToken.email) {
          const emailChanged = await familyServices.editFamily(
            {
              family_member_id: decodeToken.familyMemberId,
              email: decodeToken.email,
              is_verified: true
            },
            t
          );
          const changeEmailonFrontEgg = await userServices.editFrontEggUserEmail(emailChanged);
          res.status(200).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.EMAIL_CHANGED });
        } else {
          res
            .status(400)
            .json({ IsSuccess: true, Data: {}, Message: CONSTANTS.EMAIL_ALREADY_CHANGED });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.LINK_EXPIRED });
      }
      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    } finally {
      let logObj = {
        user_id: memberId ? memberId : 'Not Found',
        function: 'User_Change_Email',
        function_type: 'Edit',
        request: req?.body
      };

      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },
  getAllUsersForLocation: async (req, res, next) => {
    try {
      let users = await familyServices.getAllUsersForLocation(
        req.user.cust_id || req.query.cust_id,
        req.query.locations
      );
      res.status(200).json({
        IsSuccess: true,
        Data: users,
        Message: CONSTANTS.USER_FOUND
      });
      next();
    } catch (error) {
      console.log('error==>', error);
      
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  deleteFamilyMember: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { family_member_id } = req.body;
      const familyMemberDetails = await familyServices.getFamilyMemberById(family_member_id, t);
      const deleteSecondaryMember =  await familyServices.deleteFamilyMember(family_member_id, t);
      if (deleteSecondaryMember) {
        await userServices.removeFrontEggUser(familyMemberDetails.frontegg_user_id);
      }
      await t.commit();
      res.status(200).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.FAMILY_MEMBER_DELETED });
      next();
    } catch (error) {
      await t.rollback();
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  deletePrimaryFamilyMember: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { primary_family_member_id, secondary_family_member_id } = req.body;
      const primaryMemberDetails = await familyServices.getFailyMemberById(primary_family_member_id, t);
      await familyServices.editFamily({family_member_id: primary_family_member_id, status: "Disabled"}, t);
      const deletePrimaryMember = await familyServices.deleteFamilyMember(primary_family_member_id, t);
      if(deletePrimaryMember) {
        await userServices.removeFrontEggUser(primaryMemberDetails.frontegg_user_id);
      }
      let params= { family_member_id: secondary_family_member_id, member_type:"primary" }
      await familyServices.editFamily(params, t);
      await t.commit();
      res.status(200).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.FAMILY_MEMBER_DELETED });
      next();
    } catch (error) {
      await t.rollback();
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },
};
