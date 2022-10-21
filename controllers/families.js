const _ = require('lodash');
const familyServices = require('../services/families');
const childServices = require('../services/children');
const userServices = require('../services/users');
const TinyURL = require('tinyurl');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: true });
var bcrypt = require('bcryptjs');
const {
  sendRegistrationMail,
  sendEmailChangeMail,
  sendForgetPasswordMail
} = require('../lib/node-mailer');

module.exports = {
  createFamily: async (req, res, next) => {
    try {
      let { primary, secondary, children } = req.body;
      const userId = req.user.user_id;
      const custId = req.user.cust_id;

      //add primary parent

      primary.family_id = await familyServices.generateNewFamilyId(req.user.user_id);
      let primaryParent = await familyServices.createFamily({
        ...primary,
        user_id: userId,
        cust_id: custId
      });

      const familyId = primaryParent.family_id;

      //add secondary parent

      let secondaryParents = '';
      let createdFamily = Promise.all(
        secondary.map(async (family) => {
          const newFamily = await familyServices.createFamily({
            ...family,
            user_id: userId,
            cust_id: custId,
            family_id: familyId
          });

          return newFamily;
        })
      );
      secondaryParents = await createdFamily;
      if (primaryParent && secondaryParents) {
        const token = await familyServices.createPasswordToken(primaryParent);
        const name = primaryParent.first_name + ' ' + primaryParent.last_name;
        const originalUrl =
          req.get('Referrer') + 'set-password?' + 'token=' + token + '&type=family';
        const short_url = await TinyURL.shorten(originalUrl);

        await sendRegistrationMail(name, primaryParent.email, short_url);

        if (!_.isEmpty(secondaryParents)) {
          secondaryParents.foreach(async (secondaryParent) => {
            const token = await familyServices.createPasswordToken(secondaryParent);
            const name = secondaryParent.first_name + ' ' + secondaryParent.last_name;
            const originalUrl = req.get('Referrer') + 'set-password?' + token;
            const short_url = await TinyURL.shorten(originalUrl);

            await sendRegistrationMail(name, secondaryParent.email, short_url);
          });
        }
      }

      //add children

      childServices;

      let createdChildren = Promise.all(
        children.map(async (child) => {
          const newFamily = await childServices.createChild({
            ...child,
            rooms: { rooms: child.rooms },
            family_id: familyId
          });

          return newFamily;
        })
      );
      children = await createdChildren;

      res.status(201).json({
        IsSuccess: true,
        Data: { primaryParent, secondaryParents, children },
        Message: 'New  Family Created'
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message === 'Validation error' ? 'Email already exist' : error.message
      });
      next(error);
    }
  },

  editFamily: async (req, res, next) => {
    try {
      const params = req.body;
      let emailExist = false;
      const familyMember = await familyServices.getFamilyMemberById(params.family_member_id);

      if (params.email !== familyMember.email) {
        emailExist = await userServices.checkEmailExist(params.email);
      }

      if (emailExist) {
        res.status(409).json({
          IsSuccess: false,
          Data: {},
          Message: 'Email already exist'
        });
      } else {
        params.is_verified = familyMember.email != params.email ? false : true;
        const editedFamily = await familyServices.editFamily(params);

        if (editedFamily) {
          res.status(200).json({
            IsSuccess: true,
            Data: editedFamily,
            Message: `Family member details updated ${
              params.is_verified ? '' : '. please verify updated email'
            }`
          });
        } else {
          res.status(404).json({
            IsSuccess: false,
            Data: {},
            Message: 'Family member not found'
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message === 'Validation error' ? 'Email already exist' : error.message
      });
      next(error);
    }
  },

  getAllFamilyDetails: async (req, res, next) => {
    try {
      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        searchBy: req.query?.searchBy.replace(/'/g, "\\'"),
        roomsList: req.query?.rooms,
        location: req.query?.location
      };
      let familyDetails = await familyServices.getAllFamilyDetails(req.user.user_id, filter);

      res.status(200).json({
        IsSuccess: true,
        Data: familyDetails,
        Message: `All the family's details for user:${req.user.first_name}`
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  addParent: async (req, res, next) => {
    try {
      params = req.body;
      params.cust_id = req.user.cust_id;
      params.user_id = req.user.user_id;

      let emailExist = await userServices.checkEmailExist(params.email);

      if (emailExist) {
        res.status(409).json({
          IsSuccess: false,
          Data: {},
          Message: 'Email already exist'
        });
      } else {
        const parent = await familyServices.createFamily(params);

        const token = await familyServices.createPasswordToken(parent);
        const name = parent.first_name + ' ' + parent.last_name;
        const originalUrl =
          req.get('Referrer') + 'set-password?' + 'token=' + token + '&type=family';
        const short_url = await TinyURL.shorten(originalUrl);

        await sendRegistrationMail(name, parent.email, short_url);

        res.status(201).json({
          IsSuccess: true,
          Data: parent,
          Message: 'New parent added'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  deleteFamily: async (req, res, next) => {
    try {
      params = req.body;

      let deleteFamily = await familyServices.deleteFamily(params.family_id);

      res.status(200).json({
        IsSuccess: true,
        Data: {},
        Message: 'Family Deleted'
      });

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  disableFamily: async (req, res, next) => {
    try {
      params = req.body;

      let disableFamily = await familyServices.disableFamily(
        params.family_member_id,
        params.member_type,
        params.family_id,
        params?.scheduled_end_date
      );

      if (params?.scheduled_end_date) {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: 'Family is schedlued to disable at selected date'
        });
      } else {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: 'Family disabled'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },
  enableFamily: async (req, res, next) => {
    try {
      params = req.body;

      let enableFamily = await familyServices.enableFamily(
        params.family_member_id,
        params.member_type,
        params.family_id
      );

      if (params.member_type === 'secondary') {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: 'Family member enabled'
        });
      } else {
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: 'Family enabled'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        IsSuccess: false,
        Message: error.message
      });
      next(error);
    }
  },

  /* verify email and set password */
  validateFamilyMember: async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const decodeToken = engine.decrypt(token);
      let familyMember;

      familyMember = await familyServices.getFamilyMemberById(decodeToken.familyMemberId);

      if (familyMember) {
        if (!familyMember?.password) {
          const salt = await bcrypt.genSaltSync(10);
          let hashPassword = bcrypt.hashSync(password, salt);

          const setPassword = await familyServices.resetPassword(
            decodeToken.familyMemberId,
            hashPassword
          );
          res.status(200).json({
            IsSuccess: true,
            Data: {},
            Message: 'Family member password reset successful'
          });
        } else if (familyMember?.password) {
          if (familyMember.password === decodeToken?.password) {
            const salt = await bcrypt.genSaltSync(10);
            let hashPassword = bcrypt.hashSync(password, salt);
            const setPassword = await familyServices.resetPassword(
              decodeToken.familyMemberId,
              hashPassword
            );
            res.status(200).json({
              IsSuccess: true,
              Data: {},
              Message: 'Family member password reset successful'
            });
          } else {
            res.status(400).json({
              IsSuccess: false,
              Data: {},
              Message: 'password is already changed, please verify again to change password'
            });
          }
        } else {
          res.status(400).json({
            IsSuccess: false,
            Data: {},
            Message: 'Invalid token '
          });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'No user found' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  }
};
