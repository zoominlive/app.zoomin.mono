const { Users } = require('../models/index');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: true });

/* Validate email */
const validateEmail = (emailAdress) => {
  let regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (emailAdress.match(regexEmail)) {
    return true;
  } else {
    return false;
  }
};

module.exports = {
  /* Create new user */
  createUser: async (userObj) => {
    let userCreated = await Users.create(userObj);

    return userCreated;
  },

  /* Validate user params */
  userValidation: (params) => {
    let validationResponse;
    if (
      params.first_name === '' ||
      params.first_name === undefined ||
      params.last_name === '' ||
      params.last_name === undefined
    ) {
      validationResponse = {
        isValid: false,
        message: {
          IsSuccess: true,
          Data: [],
          Message: 'Please provide valid First Name & Last Name (Mandatory fields)'
        }
      };

      return validationResponse;
    } else {
      validationResponse = {
        isValid: true
      };
    }

    if (params.email === '' || params.email === undefined) {
      validationResponse = {
        isValid: false,
        message: {
          IsSuccess: true,
          Data: [],
          Message: 'Email Id is mandatory field'
        }
      };

      return validationResponse;
    } else {
      let emailData = validateEmail(params.email);

      if (emailData) {
        validationResponse = {
          isValid: true
        };
      } else {
        validationResponse = {
          isValid: false,
          message: {
            IsSuccess: true,
            Data: [],
            Message: 'Please provide valid email id'
          }
        };
      }
    }

    return validationResponse;
  },

  /* Get user via email */
  getUser: async (email) => {
    let user = await Users.findOne({
      where: { email: email }
    });
    return user ? user.toJSON() : null;
  },

  getUserById: async (userId) => {
    let user = await Users.findOne({
      where: { user_id: userId }
    });
    return user ? user.toJSON() : null;
  },

  /* Create user token */
  createUserToken: async (userId) => {
    const token = jwt.sign({ user_id: userId }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign({ user_id: userId }, process.env.JWT_REFRESH_SECRET_KEY, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });

    return { token, refreshToken };
  },

  /* Create user token to reset password */
  createPasswordToken: async (user) => {
    const token = engine.encrypt({ userId: user.user_id, password: user.password }, 600000);

    return token;
  },
  /* Create user token to change email*/
  createEmailToken: async (user, newEmail) => {
    const token = engine.encrypt({ userId: user.user_id, email: newEmail }, 600000);

    return token;
  },

  /* Reset user password */
  resetPassword: async (userId, password) => {
    let setNewPassword = await Users.update(
      { password: password },
      { returning: true, where: { user_id: userId } }
    );

    return setNewPassword;
  },

  /* Verify user */
  verifyUser: async (userId) => {
    let verifiedUser = await Users.update(
      { isVerified: true, updated_at: Sequelize.literal('CURRENT_TIMESTAMP') },
      { where: { user_id: userId } }
    );

    return verifiedUser;
  },

  /* Edit security OTP code */
  editNewSecurityCode: async (email, otp) => {
    let editCode = await Users.update({ securityCode: otp }, { where: { email: email } });

    return editCode;
  },
  /* Destroy security OTP code */
  destroySecurityCode: async (email) => {
    let destroySecurityCode = await Users.update({ securityCode: '' }, { where: { email: email } });

    return destroySecurityCode;
  },

  /* Edit user profile details */
  editUserProfile: async (user, params) => {
    let update = {
      first_name: params?.first_name !== undefined ? params?.first_name : user.first_name,
      last_name: params?.last_name !== undefined ? params?.last_name : user.last_name,
      location: params?.location !== undefined ? params?.location : user.location,
      profile_image: params.image !== undefined ? params?.image : user.profile_image,
      username: params.username !== undefined ? params?.username : user.username,
      role: params.role !== undefined ? params?.role : user.role,
      email: params?.email !== undefined ? params?.email : user.email,
      updated_at: Sequelize.literal('CURRENT_TIMESTAMP')
    };

    let updateUserProfile = await Users.update(update, {
      where: { user_id: user.user_id }
    });

    if (updateUserProfile) {
      updateUserProfile = await Users.findOne({ where: { user_id: user.user_id } });
    }

    return updateUserProfile.toJSON();
  },

  /* Edit user profile details */
  deleteUserProfile: async (userId) => {
    let deletedUserProfile = await Users.update(
      { status: 'inactive', updated_at: Sequelize.literal('CURRENT_TIMESTAMP') },
      { where: { user_id: userId } }
    );

    return deletedUserProfile;
  },

  /* Fetch all the user's details */
  getUserDetails: async () => {
    let users = await Users.findAll();
    return users;
  }
};
