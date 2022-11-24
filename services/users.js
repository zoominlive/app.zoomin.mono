const { Users, Family } = require('../models/index');
const Sequelize = require('sequelize');
const sequelize = require('../lib/database');
const jwt = require('jsonwebtoken');
const encrypter = require('object-encrypter');
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: true });
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');

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
    userObj.user_id = uuidv4();

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

  // get user by id
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
    return { token };
  },

  /* Create user token to reset password */
  createPasswordToken: async (user) => {
    const token = engine.encrypt({ userId: user.user_id, password: user.password }, 900000);

    return token;
  },
  /* Create user token to change email*/
  createEmailToken: async (user, newEmail) => {
    const token = engine.encrypt({ userId: user.user_id, email: newEmail }, 900000);

    return token;
  },

  /* Reset user password */
  resetPassword: async (userId, password) => {
    let setNewPassword = await Users.update(
      { password: password, is_verified: true },
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

  /* Edit user profile details */
  editUserProfile: async (user, params) => {
    let update = {
      first_name: params?.first_name !== undefined ? params?.first_name : user.first_name,
      last_name: params?.last_name !== undefined ? params?.last_name : user.last_name,
      location: params?.location !== undefined ? params?.location : user.location,
      profile_image: params?.image !== undefined ? params?.image : user.profile_image,
      username: params?.username !== undefined ? params?.username : user.username,
      role: params?.role !== undefined ? params?.role : user.role,
      email: params?.email !== undefined ? params?.email : user.email,
      password_link:
        params?.password_link !== undefined ? params?.password_link : user.password_link,
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

  /* Delete user profile details */
  deleteUser: async (userId) => {
    let deletedUser = await Users.destroy({ where: { user_id: userId } });

    return deletedUser;
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
  getAllUsers: async (user, filter) => {
    let { pageNumber = 0, pageSize = 10, searchBy = '', location = 'All' } = filter;

    let users;
    let count = 0;
    if (location === 'All') {
      const userdata = await Users.findAll({
        where: {
          cust_id: user.cust_id,
          user_id: {
            [Sequelize.Op.not]: user.user_id
          },
          [Sequelize.Op.or]: [
            {
              first_name: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            },
            {
              last_name: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            },
            {
              email: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            }
          ]
        },
        attributes: { exclude: ['password'] }
      });

      users = await Users.findAll({
        limit: parseInt(pageSize),
        offset: parseInt(pageNumber * pageSize),
        where: {
          cust_id: user.cust_id,
          user_id: {
            [Sequelize.Op.not]: user.user_id
          },
          [Sequelize.Op.or]: [
            {
              first_name: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            },
            {
              last_name: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            },
            {
              email: {
                [Sequelize.Op.like]: `%${searchBy}%`
              }
            }
          ]
        },

        attributes: { exclude: ['password'] }
      });
      count = userdata.length;
    } else {
      count = (
        await sequelize.query(
          `SELECT DISTINCT COUNT(user_id) AS count FROM users WHERE location LIKE '%${location}%' AND user_id !='${user.user_id}' AND (first_name LIKE '%${searchBy}%' OR last_name LIKE '%${searchBy}%' OR email LIKE '%${searchBy}%')`,
          {
            model: Users,
            mapToModel: true
          }
        )
      )[0].dataValues.count;

      users = await sequelize.query(
        `SELECT DISTINCT * FROM users WHERE location LIKE '%${location}%' AND user_id !='${
          user.user_id
        }' AND (first_name LIKE '%${searchBy}%' OR last_name LIKE '%${searchBy}%' OR email LIKE '%${searchBy}%') LIMIT ${pageSize} OFFSET ${
          pageNumber * pageSize
        }`,
        {
          model: Users,
          mapToModel: true
        }
      );
    }

    return { users, count };
  },

  // check if user already exist for given email
  checkEmailExist: async (email) => {
    const users = await Users.findOne({ where: { email: email } });

    const families = await Family.findOne({ where: { email: email } });

    if (users === null && families === null) {
      return false;
    } else {
      return true;
    }
  }
};
