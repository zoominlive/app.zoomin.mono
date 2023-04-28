const _ = require('lodash');
const familyServices = require('../services/families');
const childServices = require('../services/children');
const userServices = require('../services/users');
const logServices = require('../services/logs');
const CONSTANTS = require('../lib/constants');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: false });
const sequelize = require('../lib/database');
var bcrypt = require('bcryptjs');
const {
  sendRegistrationMailforFamilyMember,
  sendEmailChangeMail
} = require('../lib/ses-mail-sender');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  // create new family(primary parent, secondary parent ,child)
  createFamily: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      let { primary, secondary, children } = req.body;
      const userId = req.user.user_id;
      const custId = req.user.cust_id;

      //add primary parent

      let allLocations = [];
      children?.forEach((child) => {
        child?.location?.locations?.forEach((loc) => {
          allLocations.push(loc);
        });
      });

      allLocations = _.uniq(allLocations);

      primary.location = { selected_locations: allLocations, accessable_locations: allLocations };
      const newFamilyId = await familyServices.generateNewFamilyId();
      primary.family_id = newFamilyId;
      let primaryParent = await familyServices.createFamily(
        {
          ...primary,
          family_member_id: uuidv4(),
          user_id: userId,
          cust_id: custId
        },
        t
      );

      const familyId = primaryParent.family_id;

      //add secondary parent

      let secondaryParents = '';
      let familyObj = [];

      secondary?.forEach(async (family) => {
        family.location = {
          selected_locations: allLocations,
          accessable_locations: allLocations
        };

        familyObj.push({
          ...family,
          family_member_id: uuidv4(),
          user_id: userId,
          cust_id: custId,
          family_id: familyId
        });
      });
      secondaryParents = await familyServices.createFamilies(familyObj, t);

      if (primaryParent && secondaryParents) {
        const token = await familyServices.createPasswordToken(primaryParent);
        const name = primaryParent.first_name + ' ' + primaryParent.last_name;
        const originalUrl =
          process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token + '&type=family';
        // const short_url = await TinyURL.shorten(originalUrl);

        await sendRegistrationMailforFamilyMember(name, primaryParent.email, originalUrl);

        if (!_.isEmpty(secondaryParents)) {
          secondaryParents.forEach(async (secondaryParent) => {
            const token = await familyServices.createPasswordToken(secondaryParent);
            const name = secondaryParent.first_name + ' ' + secondaryParent.last_name;
            const originalUrl =
              process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token + '&type=family';
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
          rooms: { rooms: child.rooms },
          family_id: familyId,
          cust_id: custId
        });
      });

      children = await childServices.createChildren(childObjs, t);

      await t.commit();

      res.status(201).json({
        IsSuccess: true,
        Data: { primaryParent, secondaryParents, children },
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

      if (params.email !== familyMember.email) {
        emailExist = await userServices.checkEmailExist(params.email, t);
      }

      if (emailExist) {
        res.status(409).json({
          IsSuccess: false,
          Data: {},
          Message: CONSTANTS.EMAIL_EXIST
        });
      } else {
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
          const originalUrl =
            process.env.FE_SITE_BASE_URL + 'email-change?' + 'token=' + token + '&type=family';
          // const short_url = await TinyURL.shorten(originalUrl);
          const response = await sendEmailChangeMail(name, params?.email, originalUrl);
        }

        await t.commit();
        if (editedFamily) {
          res.status(200).json({
            IsSuccess: true,
            Data: editedFamily,
            Message:
              CONSTANTS.FAMILY_UPDATED +
              '. ' +
              ` ${params.is_verified ? '' : CONSTANTS.VEIRFY_UPDATED_EMAIL}`
          });
        } else {
          res.status(404).json({
            IsSuccess: false,
            Data: {},
            Message: CONSTANTS.FAMILY_MEMBER_NOT_FOUND
          });
        }
      }

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
        searchBy: req.query?.searchBy.replace(/'/g, "\\'"),
        roomsList: req.query?.rooms,
        location: req.query?.location
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
      params.cust_id = req.user.cust_id;
      params.user_id = req.user.user_id;
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
          process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token + '&type=family';
        // const short_url = await TinyURL.shorten(originalUrl);

        await sendRegistrationMailforFamilyMember(name, parent.email, originalUrl);
        await t.commit();
        res.status(201).json({
          IsSuccess: true,
          Data: parent,
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
    try {
      params = req.body;

      let deleteFamily = await familyServices.deleteFamily(params.family_id, t);

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
        request: req?.body
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
              Message: CONSTANTS.FAMIY_MEMBER_PASS_RESET
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
                Message: CONSTANTS.FAMIY_MEMBER_PASS_RESET
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
        req.user.cust_id,
        req.query.locations
      );
      res.status(200).json({
        IsSuccess: true,
        Data: users,
        Message: CONSTANTS.USER_FOUND
      });
      next();
    } catch (error) {
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  }
};
