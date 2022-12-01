var bcrypt = require('bcryptjs');
const _ = require('lodash');
const {
  sendRegistrationMailforUser,
  sendEmailChangeMail,
  sendForgetPasswordMail
} = require('../lib/ses-mail-sender');
const userServices = require('../services/users');
const familyServices = require('../services/families');
const s3BucketImageUploader = require('../lib/aws-services');
// const TinyURL = require('tinyurl');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: true });
const customerServices = require('../services/customers');
const moment = require('moment');
const CONSTANTS = require('../lib/constants');

module.exports = {
  /* Get  user's details */
  getUserDetails: async (req, res, next) => {
    try {
      const user = req.user;
      user.transcoderBaseUrl = await customerServices.getTranscoderUrl(req.user.cust_id);
      res.status(200).json({
        IsSuccess: true,
        Data: _.omit(user, ['password']),
        Message: CONSTANTS.USER_FOUND
      });
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Register new user */
  createUser: async (req, res, next) => {
    try {
      const params = req.body;
      params.cust_id = req.user.cust_id;

      let checkUserValidation = await userServices.userValidation(params);

      if (checkUserValidation && !checkUserValidation.isValid) {
        res.status(400).json(checkUserValidation.message);
      }

      let emailIs = params.email;

      emailIs = emailIs.toLowerCase();

      params.email = emailIs;

      params.is_verified = false;

      let addUser = await userServices.createUser(_.omit(params, ['image']));

      if (addUser) {
        let userData = addUser?.toJSON();

        const token = await userServices.createPasswordToken(userData);
        const name = userData.first_name + ' ' + userData.last_name;
        const originalUrl =
          process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token + '&type=user';
        // const short_url = await TinyURL.shorten(originalUrl);

        await sendRegistrationMailforUser(name, userData.email, originalUrl);

        if (req.body?.image) {
          const imageUrl = await s3BucketImageUploader._upload(req.body.image, userData.user_id);
          userData = await userServices.editUserProfile(userData, { image: imageUrl });
        }

        res.status(201).json({
          IsSuccess: true,
          Data: _.omit(userData, ['password']),
          Message: CONSTANTS.USER_REGISTERED
        });
      } else {
        res
          .status(400)
          .json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_REGISRATION_FAILED });
      }
      next();
    } catch (error) {
      console.log(error);
      res.status(500).json({
        IsSuccess: false,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    }
  },

  /* Login user */
  loginUser: async (req, res, next) => {
    try {
      let { email, password } = req.body;
      let emailIs = email;

      emailIs = emailIs.toLowerCase();

      const user = await userServices.getUser(emailIs);
      let familyUser;
      if (!user) {
        familyUser = await familyServices.getFamilyMember(emailIs);
      }

      if (user) {
        if (!user.is_verified || user.status == 'inactive') {
          res.status(400).json({
            IsSuccess: true,
            Data: [],
            Message: !user.is_verified ? CONSTANTS.USER_NOT_VERIFIED : CONSTANTS.USER_DEACTIVATED
          });
        } else {
          const validPassword = await bcrypt.compare(password, user.password);

          if (validPassword) {
            const token = await userServices.createUserToken(user.user_id);
            const userData = _.omit(user, ['password', 'cust_id']);
            res.status(200).json({
              IsSuccess: true,
              Data: { userData, ...token },
              Message: CONSTANTS.USER_LOGGED_IN
            });
          } else {
            res
              .status(400)
              .json({ IsSuccess: true, Data: {}, Message: CONSTANTS.INVALID_PASSWORD });
          }
        }
      } else if (familyUser) {
        if (!familyUser.is_verified || familyUser.status == 'Disabled') {
          res.status(400).json({
            IsSuccess: true,
            Data: [],
            Message: !familyUser.is_verified
              ? CONSTANTS.USER_NOT_VERIFIED
              : CONSTANTS.USER_DEACTIVATED
          });
        } else {
          const validPassword = await bcrypt.compare(password, familyUser.password);

          if (validPassword) {
            const token = await familyServices.createFamilyMemberToken(familyUser.family_member_id);
            const userData = _.omit(familyUser, ['password', 'cust_id']);
            res.status(200).json({
              IsSuccess: true,
              Data: { userData, ...token },
              Message: CONSTANTS.USER_LOGGED_IN
            });
          } else {
            res
              .status(400)
              .json({ IsSuccess: true, Data: {}, Message: CONSTANTS.INVALID_PASSWORD });
          }
        }
      } else {
        res.status(400).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.USER_NOT_FOUND
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Change password */
  changePassword: async (req, res, next) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = req.user;

      const validPassword = await bcrypt.compare(oldPassword, user.password);

      if (validPassword) {
        const salt = await bcrypt.genSaltSync(10);
        let hashPassword = bcrypt.hashSync(newPassword, salt);
        let changePassword;
        if (user.role === 'User' || user.role === 'Admin') {
          changePassword = await userServices.resetPassword(user.user_id, hashPassword);
        } else {
          changePassword = await familyServices.resetPassword(user.family_member_id, hashPassword);
        }
        res.status(200).json({
          IsSuccess: true,
          Data: changePassword,
          Message: CONSTANTS.PASSWORD_RESET
        });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.INVALID_PASSWORD });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },
  /* verify email and set password */
  validateUser: async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const decodeToken = engine.decrypt(token);

      if (decodeToken?.userId) {
        let user;

        user = await userServices.getUserById(decodeToken.userId);

        if (user) {
          if (!user?.password) {
            const salt = await bcrypt.genSaltSync(10);
            let hashPassword = bcrypt.hashSync(password, salt);

            const setPassword = await userServices.resetPassword(decodeToken.userId, hashPassword);

            await userServices.editUserProfile(user, { password_link: 'inactive' });
            res.status(200).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.PASSWORD_RESET });
          } else if (user?.password) {
            if (user.password === decodeToken?.password) {
              const salt = await bcrypt.genSaltSync(10);
              let hashPassword = bcrypt.hashSync(password, salt);
              const setPassword = await userServices.resetPassword(
                decodeToken.userId,
                hashPassword
              );

              await userServices.editUserProfile(user, {
                password_link: 'inactive'
              });
              res
                .status(200)
                .json({ IsSuccess: true, Data: {}, Message: CONSTANTS.PASSWORD_RESET });
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
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Forget password */
  forgetPassword: async (req, res, next) => {
    try {
      let { email } = req.body;
      email = email.toLowerCase();
      let user;
      user = await userServices.getUser(email);
      if (!user) {
        user = await familyServices.getFamilyMember(email);
      }
      if (user) {
        const userData = user;
        if (userData.role === 'Admin' || userData.role === 'User') {
          const token = await userServices.createPasswordToken(userData);
          const name = userData.first_name + ' ' + userData.last_name;
          const originalUrl =
            process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token + '&type=user';
          // const short_url = await TinyURL.shorten(originalUrl);
          await sendForgetPasswordMail(name, email, originalUrl);
          await userServices.editUserProfile(user, { password_link: 'active' });
        } else {
          const token = await familyServices.createPasswordToken(userData);
          const name = userData.first_name + ' ' + userData.last_name;
          const originalUrl =
            process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token + '&type=family';
          // const short_url = await TinyURL.shorten(originalUrl);
          await sendForgetPasswordMail(name, email, originalUrl);
          await familyServices.editFamily({
            family_member_id: user.family_member_id,
            password_link: 'active'
          });
        }

        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.PASSWORD_RESET_LINK_SENT
        });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
    next();
  },

  /* Upload image to s3 bucket */
  uploadImage: async (req, res, next) => {
    try {
      const user = req.user;
      const image = req.body.image;

      if (!_.isEmpty(user.profile_image)) {
        let deletedImage = await s3BucketImageUploader.deleteObject(user);
      }

      if (user?.family_member_id) {
        let uploadImage = await s3BucketImageUploader._upload(image, user.family_member_id);
        await familyServices.editFamily({
          profile_image: uploadImage,
          family_member_id: user.family_member_id
        });
        res
          .status(200)
          .json({ IsSuccess: true, Data: { uploadImage }, Message: CONSTANTS.IMAGE_UPLOADED });
      } else {
        let uploadImage = await s3BucketImageUploader._upload(image, user.user_id);
        await userServices.editUserProfile(user, { image: uploadImage });
        res
          .status(200)
          .json({ IsSuccess: true, Data: { uploadImage }, Message: CONSTANTS.IMAGE_UPLOADED });
      }

      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Upload image to s3 bucket */
  deleteImage: async (req, res, next) => {
    try {
      const user = req.user;

      if (user?.family_member_id) {
        let deletedImage = await s3BucketImageUploader.deleteObject(user);
        await familyServices.editFamily({
          profile_image: '',
          family_member_id: user.family_member_id
        });
        res
          .status(200)
          .json({ IsSuccess: true, Data: deletedImage, Message: CONSTANTS.IMAGE_DELETED });
      } else {
        let deletedImage = await s3BucketImageUploader.deleteObject(user);
        await userServices.editUserProfile(user, { image: '' });
        res
          .status(200)
          .json({ IsSuccess: true, Data: deletedImage, Message: CONSTANTS.IMAGE_DELETED });
      }

      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Edit user profile details */
  updateUserProfile: async (req, res, next) => {
    try {
      const params = req.body;
      const user = req.user;

      let editedProfile = await userServices.editUserProfile(user, _.omit(params, ['email'])); // user should not be allowed to edit email directly.

      if (editedProfile) {
        if (params?.email && params?.email !== user.email) {
          const newEmail = params.email;
          const emailExist = await userServices.getUser(newEmail);
          if (emailExist) {
            res.status(409).json({
              IsSuccess: true,
              Data: {},
              Message: CONSTANTS.PROFILE_UPDATED_EMAIL_ALREADY_EXIST
            });
          } else {
            const token = await userServices.createEmailToken(user, newEmail);
            const name = user.first_name + ' ' + user.last_name;
            const originalUrl =
              process.env.FE_SITE_BASE_URL + 'email-change?' + 'token=' + token + '&type=user';
            // const short_url = await TinyURL.shorten(originalUrl);

            const response = await sendEmailChangeMail(name, params?.email, originalUrl);
            res.status(200).json({
              IsSuccess: true,
              Data: _.omit(editedProfile, ['password']),
              Message: CONSTANTS.PROFILE_EDITED_VERIFY_EMAIL
            });
          }
        } else {
          res.status(200).json({
            IsSuccess: true,
            Data: _.omit(editedProfile, ['password']),
            Message: CONSTANTS.PROFILE_EDITED
          });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Edit user profile details */
  editUser: async (req, res, next) => {
    try {
      const params = req.body;

      const user = await userServices.getUserById(params.userId);

      if (params?.image) {
        const imageUrl = await s3BucketImageUploader._upload(req.body.image, user.user_id);
        params.image = imageUrl;
      }

      let editedProfile = await userServices.editUserProfile(user, _.omit(params, ['email'])); // user should not be allowed to edit email directly.
      editedProfile.transcoderBaseUrl = await customerServices.getTranscoderUrl(req.user.cust_id);
      if (editedProfile) {
        if (params?.email && params?.email !== user.email) {
          const newEmail = params.email;
          const emailExist = await userServices.getUser(newEmail);
          if (emailExist) {
            res.status(409).json({
              IsSuccess: true,
              Data: {},
              Message: CONSTANTS.PROFILE_UPDATED_EMAIL_ALREADY_EXIST
            });
          } else {
            const token = await userServices.createEmailToken(user, newEmail);
            const name = user.first_name + ' ' + user.last_name;
            const originalUrl =
              process.env.FE_SITE_BASE_URL + 'email-change?' + 'token=' + token + '&type=user';
            // const short_url = await TinyURL.shorten(originalUrl);

            const response = await sendEmailChangeMail(name, params?.email, originalUrl);
            res.status(200).json({
              IsSuccess: true,
              Data: _.omit(editedProfile, ['password']),
              Message: CONSTANTS.PROFILE_EDITED_VERIFY_EMAIL
            });
          }
        } else {
          res.status(200).json({
            IsSuccess: true,
            Data: _.omit(editedProfile, ['password']),
            Message: CONSTANTS.PROFILE_EDITED
          });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Edit user profile details */
  deleteUserProfile: async (req, res, next) => {
    try {
      const user = req.user;

      let deleted = await userServices.deleteUserProfile(user.user_id);

      if (deleted) {
        res
          .status(200)
          .json({ IsSuccess: true, Data: deleted, Message: CONSTANTS.PROFILE_DELETED });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Edit user profile details */
  deleteUser: async (req, res, next) => {
    try {
      const { userId } = req.body;

      let deleted = await userServices.deleteUser(userId);

      if (deleted) {
        res
          .status(200)
          .json({ IsSuccess: true, Data: deleted, Message: CONSTANTS.PROFILE_DELETED });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  changeRegisteredEmail: async (req, res, next) => {
    try {
      const { token } = req.body;
      const decodeToken = engine.decrypt(token);

      if (decodeToken?.userId) {
        const user = await userServices.getUserById(decodeToken.userId);

        if (user.email !== decodeToken.email) {
          const emailChanged = await userServices.editUserProfile(
            { user_id: decodeToken.userId },
            { email: decodeToken.email }
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

      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Get  user's details */
  getAllUserDetails: async (req, res, next) => {
    try {
      const user = req.user;

      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        searchBy: req.query?.searchBy.replace(/'/g, "\\'"),
        location: req.query?.location,
        pageCount: req.query?.pageCount,
        orderBy: req.query?.orderBy
      };

      const usersDetails = await userServices.getAllUsers(user, filter);
      res.status(200).json({
        IsSuccess: true,
        Data: usersDetails,
        Message: CONSTANTS.USER_FOUND
      });
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  // check if given email already exist or not
  isEmailExist: async (req, res, next) => {
    try {
      const { email } = req.body;

      const emailExist = await userServices.checkEmailExist(email);

      res.status(200).json({
        IsSuccess: true,
        Data: emailExist,
        Message: emailExist ? CONSTANTS.EMAIL_EXIST : CONSTANTS.EMAIL_IS_AVAILABLE
      });

      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  checkLinkValid: async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const decodeToken = engine.decrypt(token);

      if (decodeToken?.userId) {
        let user;

        user = await userServices.getUserById(decodeToken.userId);

        if (user) {
          if (user?.password_link === 'active') {
            res
              .status(200)
              .json({ IsSuccess: true, Data: 'active', Message: CONSTANTS.VALID_LINK });
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
      res.status(500).json({ IsSuccess: false, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  }
};
