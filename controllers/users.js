var bcrypt = require('bcryptjs');
const _ = require('lodash');
const {
  sendRegistrationMailforUser,
  sendEmailChangeMail,
  sendForgetPasswordMail
} = require('../lib/ses-mail-sender');
const userServices = require('../services/users');
const familyServices = require('../services/families');
const childServices = require('../services/children');
const s3BucketImageUploader = require('../lib/aws-services');
// const TinyURL = require('tinyurl');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: false });
const customerServices = require('../services/customers');
const logServices = require('../services/logs');
const fcmTokensServices = require('../services/fcmTokens');
const dashboardServices = require('../services/dashboard');
const CONSTANTS = require('../lib/constants');
const sequelize = require('../lib/database');
const notificationSender = require('../lib/firebase-services');
const CustomerLocations = require('../models/customer_locations');
const Users = require('../models/users');

module.exports = {
  sendNotification: async (req, res, next) => {
    try {
      let {room_id, title, body, image} = req.body
      const t = await sequelize.transaction();
      let childs = await childServices.getChildOfAssignedRoomId(room_id, t);
      let childIds = childs.flatMap(i => i.child_id)
      let familys = await childServices.getAllchildrensFamilyId(childIds, t);
      let familyIds = [...new Set(familys.flatMap(i => i.family_id))];
      let familyMembers = await familyServices.getFamilyMembersIds(familyIds);
      let familyMembersIds = familyMembers.flatMap( i => i.family_member_id);
      let fcmTokens = await fcmTokensServices.getFamilyMembersFcmTokens(familyMembersIds);
      fcmTokens = fcmTokens.flatMap(i => i.fcm_token)
      fcmTokens = [...new Set(fcmTokens)].filter(i => i!== null);
      await notificationSender.sendNotification(title, body, image, fcmTokens, null);
    
      res.status(200).json({
        IsSuccess: true,
        Data: fcmTokens,
        Message: CONSTANTS.NOTIFICATION_SENT 
      });
      next();
    } catch (error) {
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  getAllUsersForLocation: async (req, res, next) => {
    try {
      let custId = req.user.cust_id || req.query.cust_id;
      let users = await userServices.getAllUsersForLocation(custId, req.query.locations);
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
  },
  /* Get  user's details */
  getUserDetails: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const user = req.user;
      const custId = req.user.cust_id || req.query?.cust_id;
      let locations;
      if(!req.user.cust_id){
        console.log('calling===================')
        let availableLocations = await customerServices.getLocationDetails(custId)
        let locs = availableLocations.flatMap((i) => i.loc_name);
        locations = availableLocations.flatMap((i) => i.loc_name);
        user.location = { selected_locations: locs, accessable_locations: locs };
      }
      // user.transcoderBaseUrl = await customerServices.getTranscoderUrl(custId);
      console.log('locations-->', locations);
      if(user.role === 'Super Admin') {
        user.transcoderBaseUrl = await customerServices.getTranscoderUrlFromCustLocations(locations, custId);
      } else {
        user.transcoderBaseUrl = await customerServices.getTranscoderUrlFromCustLocations(user.location.accessable_locations, custId);
      }
      user.max_stream_live_license = await customerServices.getMaxLiveStramAvailable(custId);
      user.max_stream_live_license_room = await customerServices.getMaxLiveStreamRoomAvailable(custId);
      if(user.role !== 'Super Admin') {
        let activeLocations = await customerServices.getActiveLocationDetails(custId)
        activeLocations = activeLocations.flatMap((i) => i.loc_name)
        // Filter locations that are both in user's accessable_locations and activeLocations
        const updatedAccessableLocations = user.location.accessable_locations.filter((location) => activeLocations.includes(location));
        const updatedSelectedLocations = user.location.selected_locations.filter((location) => activeLocations.includes(location));
        // Update user's location.accessable_locations with the filtered array
        user.location.accessable_locations = updatedAccessableLocations;
        user.location.selected_locations = updatedSelectedLocations;
      }
      if(user.role == 'Family') {
        let customerDetail = await customerServices.getCustomerDetails(custId, t);
        user.invite_family = customerDetail.invite_user ? true : false;
      }
      await t.commit();
      res.status(200).json({
        IsSuccess: true,
        Data: _.omit(user, ['password']),
        Message: CONSTANTS.USER_FOUND
      });
      next();
    } catch (error) {
      await t.rollback();
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  },

  /* Register new user */
  createUser: async (req, res, next) => {
    const t = await sequelize.transaction();
    let userAdded;
    try {
      const params = req.body;
      params.cust_id = req.user.cust_id || req.body.cust_id;
      params.frontegg_tenant_id = req.body.tenant_id;

      let checkUserValidation = await userServices.userValidation(params);

      if (checkUserValidation && !checkUserValidation.isValid) {
        res.status(400).json(checkUserValidation.message);
        await t.commit();
        return
      }

      let emailIs = params.email;

      emailIs = emailIs.toLowerCase();

      params.email = emailIs;

      params.is_verified = false;
  
      let addUser = await userServices.createUser(_.omit(params, ['image']), t);
      
      userAdded = addUser;
      if (addUser) {
        let userData = addUser?.toJSON();
         await customerServices.editCustomer(
          params.cust_id,
          {max_stream_live_license: params.max_stream_live_license},
          t
        );

        if(params.role === 'Teacher'){
          const addRoomsToTeacher = await userServices.assignRoomsToTeacher(
            userData?.user_id,
            params?.rooms,
            t
          );
        }

        const token = await userServices.createPasswordToken(userData);
        const name = userData.first_name + ' ' + userData.last_name;
        const originalUrl =
          process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token;
        // const short_url = await TinyURL.shorten(originalUrl);

        // await sendRegistrationMailforUser(name, userData.email, originalUrl);

        if (req.body?.image) {
          const imageUrl = await s3BucketImageUploader._upload(req.body.image, userData.user_id);
          userData = await userServices.editUserProfile(userData, { image: imageUrl }, t);
        }
        //await dashboardServices.updateDashboardData(params.cust_id);
        // await t.commit();
        const {frontegg_tenant_id} = await customerServices.getCustomerDetails(params.cust_id);
        const frontEggUser = await userServices.createFrontEggUser(frontegg_tenant_id, userData);
        if(frontEggUser) {
          console.log('frontEggUser', frontEggUser);
          console.log('addUser', addUser.user_id);
          await Users.update(
            { frontegg_user_id: frontEggUser.id },
            {
              where: { user_id: addUser.dataValues.user_id },
              transaction: t 
            }
          );
        }
        res.status(201).json({
          IsSuccess: true,
          Data: _.omit(userData, ['password']),
          Message: CONSTANTS.USER_REGISTERED
        });
      } else {
        // await t.commit();
        res
          .status(400)
          .json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_REGISRATION_FAILED });
      }
      await t.commit();
      next();
    } catch (error) {
      await t.rollback();
      console.log('error-->', error);
      res.status(500).json({
        IsSuccess: false,
        error_log: error,
        Message: CONSTANTS.INTERNAL_SERVER_ERROR
      });
      next(error);
    } finally {
      let logObj = {
        user_id: userAdded?.user_id ? userAdded?.user_id : 'Not Found',
        function: 'Users',
        function_type: 'Add',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  /* Login user */
  loginUser: async (req, res, next) => {
    const t = await sequelize.transaction();
    let userFound;
    let logDetails;
    let fcmObj;
    let success = false;
    try {
      let { email, password, fcm_token, device_type } = req.body;

      let emailIs = email;
      if(fcm_token && device_type){
        fcmObj = {fcm_token: fcm_token, device_type: device_type }
      }
      emailIs = emailIs.toLowerCase();
      const user = await userServices.getUser(emailIs);
      userFound = user;
      let familyUser;
      let customer;
      if (!user) {
        familyUser = await familyServices.getFamilyMember(emailIs);
        customer = await customerServices.getCustomerDetails(familyUser.cust_id, t)
        userFound = familyUser;
      }
      
      if (user) {
        let userLocations = user.location.accessable_locations || user.location.locations;
        const locations = await CustomerLocations.findAll({
          attributes: ['loc_name', 'status'],
          where: {
            loc_name: userLocations,
          },
        });
        const locationStatusMap = locations.map(location => location.status);
        const allFalse = locationStatusMap.every(status => status === false);

        // user.transcoderBaseUrl = await customerServices.getTranscoderUrl(user.cust_id) ;
        user.max_stream_live_license = await customerServices.getMaxLiveStramAvailable(user.cust_id) ;
        if (!user.is_verified || user.status == 'inactive') {
          await t.rollback();
          res.status(400).json({
            IsSuccess: true,
            Data: [],
            Message: !user.is_verified ? CONSTANTS.USER_NOT_VERIFIED : CONSTANTS.USER_DEACTIVATED
          });
          return
        } else if(user.role !== 'Super Admin' && allFalse) {
          await t.rollback();
          res.status(400).json({
            IsSuccess: true,
            Data: [],
            Message: CONSTANTS.NO_ACTIVE_LOCATION_FOUND
          });
        } else {
          const validPassword = await bcrypt.compare(password, user.password);

          if (validPassword) {
            const token = await userServices.createUserToken(user.user_id);
            user.profile_image = user.profile_image !== null ? user.profile_image : ''
            const userData = _.omit(user, ['password', 'cust_id']);
            success = true;
            if(fcmObj){
            fcmObj = { 
              ...fcmObj,
              user_id:userFound?.user_id
            }
            await fcmTokensServices.createFcmToken(fcmObj, t);
          }
            await t.commit();
            res.status(200).json({
              IsSuccess: true,
              Data: { userData, ...token },
              Message: CONSTANTS.USER_LOGGED_IN
            });
          } else {
            //await t.commit();
            await t.rollback();
            res
              .status(400)
              .json({ IsSuccess: true, Data: {}, Message: CONSTANTS.INVALID_PASSWORD });
            return
          }
        }
      } else if (familyUser) {
        let userLocations = familyUser.location?.accessable_locations;
        const locations = await CustomerLocations.findAll({
          attributes: ['loc_name', 'status'],
          where: {
            loc_name: userLocations,
          },
        });
        const locationStatusMap = locations.map(location => location.status);
        const allFalse = locationStatusMap.every(status => status === false)

        // familyUser.transcoderBaseUrl = await customerServices.getTranscoderUrl(familyUser.cust_id);
        familyUser.invite_family = customer.invite_user ? true : false
        if (!familyUser.is_verified || familyUser.status == 'Disabled') {
          //await t.commit();
          await t.rollback();
          res.status(400).json({
            IsSuccess: true,
            Data: [],
            Message: !familyUser.is_verified
              ? CONSTANTS.USER_NOT_VERIFIED
              : CONSTANTS.USER_DEACTIVATED
          });
          return
        } else if(familyUser.role !== 'Super Admin' && allFalse) {
          await t.rollback();
          res.status(400).json({
            IsSuccess: true,
            Data: [],
            Message: CONSTANTS.NO_ACTIVE_LOCATION_FOUND
          });
        } else {
          const validPassword = await bcrypt.compare(password, familyUser.password);

          if (validPassword) {
            const token = await familyServices.createFamilyMemberToken(familyUser.family_member_id);
            familyUser.profile_image = familyUser.profile_image !== null ? familyUser.profile_image : ''
            const userData = _.omit(familyUser, ['password', 'cust_id']);
            if(fcmObj){
            fcmObj = { 
              ...fcmObj,
              family_member_id:userFound?.family_member_id
            }
            await fcmTokensServices.createFcmToken(fcmObj, t);
          }
            await t.commit();
            success = true;
            res.status(200).json({
              IsSuccess: true,
              Data: { userData, ...token },
              Message: CONSTANTS.USER_LOGGED_IN
            });
          } else {
            await t.rollback();
            //await t.commit();
            res
              .status(400)
              .json({ IsSuccess: true, Data: {}, Message: CONSTANTS.INVALID_PASSWORD });
            return
          }
        }
      } else {
        //await t.commit();
        await t.rollback();
        console.log('calling=====================')
        res.status(400).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.USER_NOT_FOUND
        });
        return
      }
      // await t.commit();
      next();
    } catch (error) {
      await logServices.addAccessErrorLog(logDetails?.log_id ?? 'not found', error);
      //await t.commit();
      await t.rollback();
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    } finally {
      let logObj = {
        user_id: userFound?.family_member_id
          ? userFound?.family_member_id
          : userFound?.user_id
          ? userFound?.user_id
          : 'Not Found',
        function:
          userFound?.member_type == 'primary'
            ? 'Primary_Family'
            : userFound?.member_type == 'secondary'
            ? 'Second_Family'
            : 'Users',
        function_type: 'Login',
        response: { success: success }
      };
      
      try {
        logDetails = await logServices.addAccessLog(logObj);
        // userObj = { 
        //   ...userObj,
        //   user_id: userFound?.family_member_id
        //   ? userFound?.family_member_id
        //   : userFound?.user_id
        //   ? userFound?.user_id
        //   : 'Not Found'
        // };
        // await userServices.editUserProfile(userObj, _.omit(userObj, ['user_id']), t);
      } catch (e) {
        console.log(e);
        await t.rollback();
      }
      
    }
  },

  /* Change password */
  changePassword: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { oldPassword, newPassword } = req.body;
      const user = req.user;

      const validPassword = await bcrypt.compare(oldPassword, user.password);

      if (validPassword) {
        const salt = await bcrypt.genSaltSync(10);
        let hashPassword = bcrypt.hashSync(newPassword, salt);
        let changePassword;
        if (user.role === 'User' || user.role === 'Admin') {
          changePassword = await userServices.resetPassword(user.user_id, hashPassword, t);
        } else {
          changePassword = await familyServices.resetPassword(
            user.family_member_id,
            hashPassword,
            t
          );
        }
        res.status(200).json({
          IsSuccess: true,
          Data: changePassword,
          Message: CONSTANTS.PASSWORD_RESET
        });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.INVALID_PASSWORD });
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
  /* verify email and set password */
  validateUser: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { token, password } = req.body;
      const decodeToken = engine.decrypt(token);

      if (decodeToken?.userId) {
        let user;

        user = await userServices.getUserById(decodeToken.userId, t);

        if (user) {
          if (!user?.password) {
            const salt = await bcrypt.genSaltSync(10);
            let hashPassword = bcrypt.hashSync(password, salt);

            const setPassword = await userServices.resetPassword(
              decodeToken.userId,
              hashPassword,
              t
            );

            await userServices.editUserProfile(user, { password_link: 'inactive' }, t);
            res.status(200).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.PASSWORD_RESET });
          } else if (user?.password) {
            if (user.password === decodeToken?.password) {
              const salt = await bcrypt.genSaltSync(10);
              let hashPassword = bcrypt.hashSync(password, salt);
              const setPassword = await userServices.resetPassword(
                decodeToken.userId,
                hashPassword,
                t
              );

              await userServices.editUserProfile(
                user,
                {
                  password_link: 'inactive'
                },
                t
              );
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
      }
      else if (decodeToken.familyMemberId) {
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
      }
      else {
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

  /* Forget password */
  forgetPassword: async (req, res, next) => {
    const t = await sequelize.transaction();
    let userFound;
    try {
      let { email } = req.body;
      email = email.toLowerCase();
      let user;
      user = await userServices.getUser(email, t);
      userFound = user;
      if (!user) {
        user = await familyServices.getFamilyMember(email, t);
        userFound = user;
      }
      if (user) {
        const userData = user;
        if(userData.is_verified) {
        if (userData.role === 'Admin' || userData.role === 'User') {
          const token = await userServices.createPasswordToken(userData);
          const name = userData.first_name + ' ' + userData.last_name;
          const originalUrl =
            process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token;
          // const short_url = await TinyURL.shorten(originalUrl);
          await sendForgetPasswordMail(name, email, originalUrl);
          await userServices.editUserProfile(user, { password_link: 'active' }, t);
        } else {
          const token = await familyServices.createPasswordToken(userData);
          const name = userData.first_name + ' ' + userData.last_name;
          const originalUrl =
            process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token;
          // const short_url = await TinyURL.shorten(originalUrl);
          await sendForgetPasswordMail(name, email, originalUrl);
          await familyServices.editFamily(
            {
              family_member_id: user.family_member_id,
              password_link: 'active'
            },
            t
          );
        }
        res.status(200).json({
          IsSuccess: true,
          Data: {},
          Message: CONSTANTS.PASSWORD_RESET_LINK_SENT
        });
      }
      else{
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_VERIFIED });
      }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
      }
      await t.commit();
      next();
    } catch (error) {
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    } finally {
      let logObj = {
        user_id: userFound?.family_member_id
          ? userFound?.family_member_id
          : userFound?.user_id
          ? userFound?.user_id
          : 'Not Found',
        function: 'User_Forgot_Password',
        function_type: 'Edit',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  /* Upload image to s3 bucket */
  uploadImage: async (req, res, next) => {
    const t = await sequelize.transaction();
    let imageExist;
    try {
      const user = req.user;
      const image = req.body.image;
      imageExist = req.user.profile_image != null ? true : false;
      if (!_.isEmpty(user.profile_image)) {
        let deletedImage = await s3BucketImageUploader.deleteObject(user);
      }

      if (user?.family_member_id) {
        let uploadImage = await s3BucketImageUploader._upload(image, user.family_member_id);
        await familyServices.editFamily(
          {
            profile_image: uploadImage,
            family_member_id: user.family_member_id
          },
          t
        );
        res
          .status(200)
          .json({ IsSuccess: true, Data: { uploadImage }, Message: CONSTANTS.IMAGE_UPLOADED });
      } else {
        let uploadImage = await s3BucketImageUploader._upload(image, user.user_id);
        await userServices.editUserProfile(user, { image: uploadImage }, t);
        res
          .status(200)
          .json({ IsSuccess: true, Data: { uploadImage }, Message: CONSTANTS.IMAGE_UPLOADED });
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
        user_id: req.user?.family_member_id
          ? req.user?.family_member_id
          : req.user?.user_id
          ? req.user?.user_id
          : 'Not Found',
        function: 'Profile_Photo',
        function_type: imageExist ? 'Edit' : 'Add',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  /* Upload image to s3 bucket */
  deleteImage: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const user = req.user;

      if (user?.family_member_id) {
        let deletedImage = await s3BucketImageUploader.deleteObject(user);
        await familyServices.editFamily(
          {
            profile_image: '',
            family_member_id: user.family_member_id
          },
          t
        );
        res
          .status(200)
          .json({ IsSuccess: true, Data: deletedImage, Message: CONSTANTS.IMAGE_DELETED });
      } else {
        let deletedImage = await s3BucketImageUploader.deleteObject(user);
        await userServices.editUserProfile(user, { image: '' }, t);
        res
          .status(200)
          .json({ IsSuccess: true, Data: deletedImage, Message: CONSTANTS.IMAGE_DELETED });
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
        user_id: req.user?.family_member_id
          ? req.user?.family_member_id
          : req.user?.user_id
          ? req.user?.user_id
          : 'Not Found',
        function: 'Profile_Photo',
        function_type: 'Delete',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  /* Edit user profile details */
  updateUserProfile: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;
      const user = req.user;

      if(params.role === 'Family'){
        let familyMember;
        try {
          let emailExist = false;
          familyMember = await familyServices.getFamilyMemberById(
            user.family_member_id,
            t
          );
          if (params.email !== familyMember.email) {
            emailExist = await userServices.checkEmailExist(params.email, t);
          }

          if (emailExist) {
            res.status(409).json({
              IsSuccess: false,
              Data: {},
              Message: CONSTANTS.EMAIL_EXIST,
            });
          } else {
            // params.is_verified =
            //   familyMember.email != params.email ? false : true;
            let editedFamily;
            if (user.is_verified) {
              editedFamily = await familyServices.updateFamily(user, params, t);
            } else {
              editedFamily = await familyServices.editFamily(
                _.omit(params, ["email"]),
                t
              );
            }

            if (!user.is_verified) {
              const token = await familyServices.createEmailToken(
                editedFamily,
                params.email
              );
              const name =
                editedFamily.first_name + " " + editedFamily.last_name;
              const originalUrl =
                process.env.FE_SITE_BASE_URL +
                "email-change?" +
                "token=" +
                token;
              // const short_url = await TinyURL.shorten(originalUrl);
              const response = await sendEmailChangeMail(
                name,
                params?.email,
                originalUrl
              );
            }

            if (editedFamily) {
              res.status(200).json({
                IsSuccess: true,
                Data: editedFamily,
                Message:
                  CONSTANTS.FAMILY_UPDATED +
                  ". " +
                  ` ${
                    user.is_verified ? "" : CONSTANTS.VEIRFY_UPDATED_EMAIL
                  }`,
              });
            } else {
              res.status(404).json({
                IsSuccess: false,
                Data: {},
                Message: CONSTANTS.FAMILY_MEMBER_NOT_FOUND,
              });
            }
          }
        } catch (error) {
          await t.rollback();
          res.status(500).json({
            IsSuccess: false,
            error_log: error,
            Message:
              error.message === "Validation error"
                ? CONSTANTS.EMAIL_EXIST
                : CONSTANTS.INTERNAL_SERVER_ERROR,
          });
          next(error);
        } finally {
          let logObj = {
            user_id: familyMember?.family_member_id
              ? familyMember?.family_member_id
              : "Not Found",
            function:
              familyMember?.member_type == "primary"
                ? "Primary_Family"
                : "Second_Family",
            function_type: "Edit",
            request: req?.body,
          };

          try {
            await logServices.addChangeLog(logObj);
          } catch (e) {
            console.log(e);
          }
        }
      }else{
        let editedProfile = await userServices.editUserProfile(user, _.omit(params, ['email']), t); // user should not be allowed to edit email directly.
  
        if (editedProfile) {
          if (params?.email && params?.email !== user.email) {
            const newEmail = params.email;
            const emailExist = await userServices.getUser(newEmail, t);
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
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Users',
        function_type: 'Edit',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  /* Edit user profile details */
  editUser: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const params = req.body;

      const user = await userServices.getUserById(params.userId);
      if(params.inviteUser) {
        try {
          const token = await userServices.createPasswordToken(user);
          const name = user?.first_name + ' ' + user?.last_name;
          const originalUrl = process.env.FE_SITE_BASE_URL + 'set-password?' + 'token=' + token;
          await sendRegistrationMailforUser(name, user.email, originalUrl);
          res.status(200).json({
            IsSuccess: true,
            Message: CONSTANTS.RESEND_INVITE
          });
        } catch (error) {
          console.log(error);
        }
      }

      if (params?.image) {
        const imageUrl = await s3BucketImageUploader._upload(req.body.image, user.user_id);
        params.image = imageUrl;
      }

      let editedProfile = await userServices.editUserProfile(user, _.omit(params, ['email']), t); // user should not be allowed to edit email directly.

      if(params.role === 'Teacher'){
        const roomsEdited = await userServices.editAssignedRoomsToTeacher(
          user.user_id,
          params?.rooms,
          t
        );
      }
      // editedProfile.transcoderBaseUrl = await customerServices.getTranscoderUrl(req.user.cust_id);
      if (editedProfile) {
        if (params?.email && params?.email !== user.email) {
          const newEmail = params.email;
          const emailExist = await userServices.getUser(newEmail, t);
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
          await customerServices.editCustomer(
            params.cust_id,
            {max_stream_live_license: params.max_stream_live_license},
            t
          );

          res.status(200).json({
            IsSuccess: true,
            Data: _.omit(editedProfile, ['password']),
            Message: CONSTANTS.PROFILE_EDITED
          });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
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
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Users',
        function_type: 'Edit',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  /* Edit user profile details */
  deleteUserProfile: async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const user = req.user;

      let deleted = await userServices.deleteUserProfile(user.user_id, t);

      if (deleted) {
        res
          .status(200)
          .json({ IsSuccess: true, Data: deleted, Message: CONSTANTS.PROFILE_DELETED });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
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
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Users',
        function_type: 'Delete',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  /* Edit user profile details */
  deleteUser: async (req, res, next) => {
    const t = await sequelize.transaction();
    let userDetails;
    let deletedByUserDetails;
    try {
      const { userId, frontegg_user_id, custId, max_stream_live_license } = req.body;
      userDetails = await userServices.getUserById(userId, t);
      deletedByUserDetails = await userServices.getUserById(req?.user?.user_id, t);
      let deleted = await userServices.deleteUser(userId, t);

      if (deleted) {
        if(custId && max_stream_live_license){
          await customerServices.editCustomer(
            custId,
            {max_stream_live_license: max_stream_live_license},
            t
            );
          }
          if(frontegg_user_id !== null) {
            const frontEggUser = await userServices.removeFrontEggUser(frontegg_user_id)
          }
        res
          .status(200)
          .json({ IsSuccess: true, Data: deleted, Message: CONSTANTS.PROFILE_DELETED });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.USER_NOT_FOUND });
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
        user_id: req?.user?.user_id ? req?.user?.user_id : 'Not Found',
        function: 'Users',
        function_type: 'Delete',
        request: {
          Deleted_By: deletedByUserDetails.first_name + ' ' + deletedByUserDetails.last_name,
          Deleted_UserId: userDetails?.user_id,
          Deleted_User_Name: userDetails?.first_name + ' ' + userDetails?.last_name,
        }
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  changeRegisteredEmail: async (req, res, next) => {
    const t = await sequelize.transaction();
    let userId;
    try {
      const { token } = req.body;
      const decodeToken = engine.decrypt(token);

      if (decodeToken?.userId) {
        userId = decodeToken?.userId;
        const user = await userServices.getUserById(decodeToken.userId);

        if (user.email !== decodeToken.email) {
          const emailChanged = await userServices.editUserProfile(
            { user_id: decodeToken.userId },
            { email: decodeToken.email },
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
        user_id: userId ? userId : 'Not Found',
        function: 'User_Change_Email',
        function_type: 'Edit',
        request: req.body
      };
      try {
        await logServices.addChangeLog(logObj);
      } catch (e) {
        console.log(e);
      }
    }
  },

  /* Get  user's details */
  getAllUserDetails: async (req, res, next) => {
    try {
      const user = req.user;

      const filter = {
        pageNumber: req.query?.pageNumber,
        pageSize: req.query?.pageSize,
        searchBy: req.query?.searchBy?.replace(/'/g, "\\'"),
        location: req.query?.location,
        role: req.query?.role,
        liveStreaming: req.query?.liveStreaming,
        pageCount: req.query?.pageCount,
        orderBy: req.query?.orderBy,
        cust_id: req.query?.cust_id
      };

      const usersDetails = await userServices.getAllUsers(user, filter);
      res.status(200).json({
        IsSuccess: true,
        Data: usersDetails,
        Message: CONSTANTS.USER_FOUND
      });
      next();
    } catch (error) {
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
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
      }
      else if (decodeToken?.familyMemberId) {
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
      }
      else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.LINK_EXPIRED });
      }
      next();
    } catch (error) {
      res
        .status(500)
        .json({ IsSuccess: false, error_log: error, Message: CONSTANTS.INTERNAL_SERVER_ERROR });
      next(error);
    }
  }
};
