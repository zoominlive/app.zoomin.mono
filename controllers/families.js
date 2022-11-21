const _ = require('lodash');
const familyServices = require('../services/families');
const childServices = require('../services/children');
const userServices = require('../services/users');
const TinyURL = require('tinyurl');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: true });
var bcrypt = require('bcryptjs');
const {
  sendRegistrationMailforFamilyMember,
  sendEmailChangeMail
} = require('../lib/ses-mail-sender');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  // create new family(primary parent, secondary parent ,child)
  createFamily: async (req, res, next) => {
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
      primary.family_id = await familyServices.generateNewFamilyId(req.user.user_id);
      let primaryParent = await familyServices.createFamily({
        ...primary,
        family_member_id: uuidv4(),
        user_id: userId,
        cust_id: custId
      });

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
      secondaryParents = await familyServices.createFamilies(familyObj);

      if (primaryParent && secondaryParents) {
        const token = await familyServices.createPasswordToken(primaryParent);
        const name = primaryParent.first_name + ' ' + primaryParent.last_name;
        const originalUrl =
          req.get('Referrer') + 'set-password?' + 'token=' + token + '&type=family';
        const short_url = await TinyURL.shorten(originalUrl);

        await sendRegistrationMailforFamilyMember(name, primaryParent.email, short_url);

        if (!_.isEmpty(secondaryParents)) {
          secondaryParents.forEach(async (secondaryParent) => {
            const token = await familyServices.createPasswordToken(secondaryParent);
            const name = secondaryParent.first_name + ' ' + secondaryParent.last_name;
            const originalUrl = req.get('Referrer') + 'set-password?' + token;
            const short_url = await TinyURL.shorten(originalUrl);

            await sendRegistrationMailforFamilyMember(name, secondaryParent.email, short_url);
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
          family_id: familyId
        });
      });

      children = await childServices.createChildren(childObjs);

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

  // edit family member details
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
        let editedFamily;
        if (params.is_verified) {
          editedFamily = await familyServices.editFamily(params);
        } else {
          editedFamily = await familyServices.editFamily(_.omit(params, ['email']));
        }

        if (!params.is_verified) {
          const token = await familyServices.createEmailToken(editedFamily, params.email);
          const name = editedFamily.first_name + ' ' + editedFamily.last_name;
          const originalUrl =
            req.get('Referrer') + 'email-change?' + 'token=' + token + '&type=family';
          const short_url = await TinyURL.shorten(originalUrl);
          const response = await sendEmailChangeMail(name, params?.email, short_url);
        }

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

  // list family details for family list page.
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

  // add new parent to existing family
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

        await sendRegistrationMailforFamilyMember(name, parent.email, short_url);

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

  // delete family
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

  // disable family member
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

  // enable family member
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

      if (decodeToken.familyMemberId) {
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

            await familyServices.editFamily({
              family_member_id: familyMember.family_member_id,
              password_link: 'inactive'
            });
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

              await familyServices.editFamily({
                family_member_id: familyMember.family_member_id,
                password_link: 'inactive'
              });
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
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'Link Expired' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
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
              Message: 'Link expired'
            });
          }
        } else {
          res.status(400).json({ IsSuccess: true, Data: {}, Message: 'No user found' });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'Link Expired' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  },

  // change registered email and send verification mail
  changeRegisteredEmail: async (req, res, next) => {
    try {
      const { token } = req.body;
      const decodeToken = engine.decrypt(token);

      if (decodeToken?.familyMemberId) {
        const user = await familyServices.getFamilyMemberById(decodeToken.familyMemberId);

        if (user.email !== decodeToken.email) {
          const emailChanged = await familyServices.editFamily({
            family_member_id: decodeToken.familyMemberId,
            email: decodeToken.email,
            is_verified: true
          });

          res
            .status(200)
            .json({ IsSuccess: true, Data: {}, Message: 'Email successfully changed ' });
        } else {
          res.status(400).json({ IsSuccess: true, Data: {}, Message: 'Email is already changed' });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'Link Expired' });
      }

      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  }
};
