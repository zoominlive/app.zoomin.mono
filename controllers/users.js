var bcrypt = require('bcryptjs');
const _ = require('lodash');
const otpGenerator = require('otp-generator');
const sendMailService = require('../lib/node-mailer');
const userServices = require('../services/users');
const s3BucketImageUploader = require('../lib/aws-services');
const { editUserProfile } = require('../services/users');

module.exports = {
  /* Get  user's details */
  getUserDetails: async (req, res, next) => {
    try {
      const user = req.user;
      res.status(200).json({
        IsSuccess: true,
        Data: _.omit(user, ['password']),
        Message: 'User found'
      });
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  },

  /* Register new user */
  createUser: async (req, res, next) => {
    try {
      const params = req.body;

      let checkUserValidation = await userServices.userValidation(params);

      if (checkUserValidation && !checkUserValidation.isValid) {
        res.status(400).json(checkUserValidation.message);
      }

      let emailIs = params.email;

      emailIs = emailIs.toLowerCase();

      params.email = emailIs;

      const salt = await bcrypt.genSaltSync(10);
      let hashPassword = bcrypt.hashSync(params.password, salt);

      params.password = hashPassword;

      params.is_verified = true;

      let addUser = await userServices.createUser(_.omit(params, ['image']));

      if (addUser) {
        let userData = addUser?.toJSON();
        if (req.body?.image) {
          const imageUrl = await s3BucketImageUploader._upload(req.body.image, userData.user_id);
          userData = await editUserProfile(userData, { image: imageUrl });
        }

        res.status(201).json({
          IsSuccess: true,
          Data: _.omit(userData, ['password', 'securityCode']),
          Message: 'User Registration Successful , please check email to create new password'
        });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'User is not registered' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  },

  /* Login user */
  loginUser: async (req, res, next) => {
    try {
      let { username_email, password } = req.body;

      let emailIs = username_email;

      emailIs = emailIs.toLowerCase();

      username_email = emailIs;

      const user = await userServices.getUser(username_email);

      if (user === undefined || user === null) {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'User not found' });
      }

      if (user) {
        if (!user.is_verified || user.status == 'inactive') {
          res.status(400).json({
            IsSuccess: true,
            Data: [],
            Message: !user.is_verified
              ? 'You are not verified to logged in'
              : 'User is deactivated please contact Administrator'
          });
        }
        const validPassword = await bcrypt.compare(password, user.password);

        if (validPassword) {
          const token = await userServices.createUserToken(user.user_id);
          const userData = _.omit(user, ['password']);
          res
            .status(200)
            .json({ IsSuccess: true, Data: { userData, ...token }, Message: 'User logged in' });
        } else {
          res.status(400).json({ IsSuccess: true, Data: {}, Message: 'Invalid Password' });
        }
      } else {
        res.status(400).json({
          IsSuccess: true,
          Data: {},
          Message: 'No user found for this email id / user name'
        });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
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
        let changePassword = await userServices.resetPassword(user.user_id, hashPassword);
        res.status(200).json({
          IsSuccess: true,
          Data: changePassword,
          Message: 'Password reset successfully'
        });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'Invalid password' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  },
  /* Check user OTP & verified */
  validateUser: async (req, res, next) => {
    try {
      const { emailId, otp } = req.body;

      let user = await userServices.getUser(emailId);

      if (user) {
        if (Number(user.securityCode) === Number(otp)) {
          let userIs = await userServices.verifyUser(user.user_id);
          res.status(200).json({ IsSuccess: true, Data: userIs, Message: 'User verified' });
        } else {
          res.status(400).json({ IsSuccess: true, Data: {}, Message: 'Invalid OTP' });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'No user found' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  },

  /* Resend security code for verification / activation of user */
  resendSecurityCode: async (req, res, next) => {
    try {
      const { email } = req.body;

      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
      });

      let newSecurityCode = await userServices.editNewSecurityCode(email, otp);

      setTimeout(() => userServices.destroySecurityCode(email), 300000);

      if (newSecurityCode) {
        await sendMailService.sendOTPMail(email, otp);
        res.status(200).json({
          IsSuccess: true,
          Data: 1,
          Message: 'New security code sended please check your mail inbox'
        });
      } else {
        res.status(400).json({ IsSuccess: true, Data: 0, Message: 'New security code not sended' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  },

  /* Forget password */
  forgetPassword: async (req, res, next) => {
    try {
      const { email, otp, newPassword } = req.body;

      const user = await userServices.getUser(email);

      if (user) {
        if (Number(user.securityCode) === Number(otp)) {
          const salt = await bcrypt.genSaltSync(10);
          let hashPassword = bcrypt.hashSync(newPassword, salt);

          let changePassword = await userServices.resetPassword(user.user_id, hashPassword);
          res.status(200).json({
            IsSuccess: true,
            Data: { changePassword },
            Message: 'Password reset successfully'
          });
        } else {
          res.status(400).json({ IsSuccess: true, Data: {}, Message: 'Invalid OTP' });
        }
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'No user found' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
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
      let uploadImage = await s3BucketImageUploader._upload(image, user.user_id);
      await userServices.editUserProfile(user, { image: uploadImage });
      res.status(200).json({ IsSuccess: true, Data: { uploadImage }, Message: 'Image uploaded' });
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  },

  /* Upload image to s3 bucket */
  deleteImage: async (req, res, next) => {
    try {
      const user = req.user;
      let deletedImage = await s3BucketImageUploader.deleteObject(user);
      await userServices.editUserProfile(user, { image: '' });
      res.status(200).json({ IsSuccess: true, Data: deletedImage, Message: 'Image deleted' });
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  },

  /* Edit user profile details */
  updateUserProfile: async (req, res, next) => {
    try {
      const params = req.body;
      const user = req.user;

      let editedProfile = await userServices.editUserProfile(user, params);

      if (editedProfile) {
        res.status(200).json({
          IsSuccess: true,
          Data: _.omit(editedProfile, ['password']),
          Message: 'User profile edited'
        });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'No user profile found' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  },

  /* Edit user profile details */
  deleteUserProfile: async (req, res, next) => {
    try {
      const user = req.user;

      let deleted = await userServices.deleteUserProfile(user.user_id);

      if (deleted) {
        res.status(200).json({ IsSuccess: true, Data: deleted, Message: 'User profile deleted' });
      } else {
        res.status(400).json({ IsSuccess: true, Data: {}, Message: 'No user profile found' });
      }
      next();
    } catch (error) {
      res.status(500).json({ IsSuccess: false, Message: error.message });
      next(error);
    }
  }
};
