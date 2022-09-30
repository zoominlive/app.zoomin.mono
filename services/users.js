const { Users, CustomerLocations, Child, Customers, Family } = require('../models/index');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');

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
    CustomerLocations.sync();
    Child.sync();
    Customers.sync();
    Family.sync();
    Users.sync();
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

    if (params.password === '' || params.password === undefined) {
      validationResponse = {
        isValid: false,
        message: {
          IsSuccess: true,
          Data: [],
          Message: 'Please provide valid password (Mandatory fields)'
        }
      };

      return validationResponse;
    }

    return validationResponse;
  },

  /* Get user via email */
  getUser: async (username_email) => {
    const isValidEmail = validateEmail(username_email);

    let user;
    if (isValidEmail) {
      user = await Users.findOne({
        where: { email: username_email }
      });
    } else {
      user = await Users.findOne({
        where: { username: username_email }
      });
    }

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
