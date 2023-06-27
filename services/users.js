const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const sequelize = require("../lib/database");
const jwt = require("jsonwebtoken");
const encrypter = require("object-encrypter");
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: false });
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");

var validator = require("validator");
const RoomsInTeacher = require("../models/rooms_assigned_to_teacher");
const customerServices = require('../services/customers')
/* Validate email */
const validateEmail = (emailAdress) => {
  // let regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  // if (emailAdress.match(regexEmail)) {
  //   return true;
  // } else {
  //   return false;
  // }

  return validator.isEmail(emailAdress);
};

module.exports = {
  /* Create new user */
  createUser: async (userObj, t) => {
    const { Users } = await connectToDatabase();
    userObj.user_id = uuidv4();

    let userCreated = await Users.create(userObj, { transaction: t });

    return userCreated;
  },

  /* Validate user params */
  userValidation: async (params) => {
    const { Users } = await connectToDatabase();
    let validationResponse;
    if (
      params.first_name === "" ||
      params.first_name === undefined ||
      params.last_name === "" ||
      params.last_name === undefined
    ) {
      validationResponse = {
        isValid: false,
        message: {
          IsSuccess: true,
          Data: [],
          Message:
            "Please provide valid First Name & Last Name (Mandatory fields)",
        },
      };

      return validationResponse;
    } else {
      validationResponse = {
        isValid: true,
      };
    }

    if (params.email === "" || params.email === undefined) {
      validationResponse = {
        isValid: false,
        message: {
          IsSuccess: true,
          Data: [],
          Message: "Email Id is mandatory field",
        },
      };

      return validationResponse;
    } else {
      let emailData = validateEmail(params.email);

      if (emailData) {
        // validationResponse = {
        //   isValid: true,
        // };
        let emailCheck = await Users.findOne({ where: { email: params.email } });

        if (emailCheck) {
          validationResponse = {
            isValid: false,
            message: {
              IsSuccess: true,
              Data: [],
              Message: "Email already exist",
            },
          };
        } else {
          validationResponse = {
            isValid: true,
          };
        }
      } else {
        validationResponse = {
          isValid: false,
          message: {
            IsSuccess: true,
            Data: [],
            Message: "Please provide valid email id",
          },
        };
      }

   
  }
    return validationResponse;
  },

  /* Get user via email */
  getUser: async (email, t) => {
    const { Users } = await connectToDatabase();
    let user = await Users.findOne(
      {
        where: { email: email },
      },
      { transaction: t }
    );
    return user ? user.toJSON() : null;
  },

  // get user by id
  getUserById: async (userId, t) => {
    const { Users } = await connectToDatabase();
    let user = await Users.findOne(
      {
        where: { user_id: userId },
      },
      { transaction: t }
    );
    return user ? user.toJSON() : null;
  },

  /* Create user token */
  createUserToken: async (userId) => {
    const token = jwt.sign({ user_id: userId }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    });
    return { token };
  },

  /* Create user token to reset password */
  createPasswordToken: async (user, registerFlag) => {
    const duration = registerFlag ? 60 * 1000 * 60 * 96 : 900000;
    const token = engine.encrypt(
      { userId: user.user_id, password: user.password },
      duration
    );

    return token;
  },
  /* Create user token to change email*/
  createEmailToken: async (user, newEmail) => {
    const token = engine.encrypt(
      { userId: user.user_id, email: newEmail },
      900000
    );

    return token;
  },

  /* Reset user password */
  resetPassword: async (userId, password, t) => {
    const { Users } = await connectToDatabase();
    let setNewPassword = await Users.update(
      { password: password, is_verified: true },
      { returning: true, where: { user_id: userId } },
      { transaction: t }
    );

    return setNewPassword;
  },

  /* Verify user */
  verifyUser: async (userId, t) => {
    const { Users } = await connectToDatabase();
    let verifiedUser = await Users.update(
      { isVerified: true },
      { where: { user_id: userId } },
      { transaction: t }
    );

    return verifiedUser;
  },

  /* Edit user profile details */
  editUserProfile: async (user, params, t) => {
    const { Users } = await connectToDatabase();
    let update = {
      first_name:
        params?.first_name !== undefined ? params?.first_name : user.first_name,
      last_name:
        params?.last_name !== undefined ? params?.last_name : user.last_name,
      location:
        params?.location !== undefined ? params?.location : user.location,
      profile_image:
        params?.image !== undefined ? params?.image : user.profile_image,
      username:
        params?.username !== undefined ? params?.username : user.username,
      role: params?.role !== undefined ? params?.role : user.role,
      email: params?.email !== undefined ? params?.email : user.email,
      password_link:
        params?.password_link !== undefined
          ? params?.password_link
          : user.password_link,
      fcm_token:
        params?.fcm_token !== undefined ? params?.fcm_token : user.fcm_token,
      device_type:
        params?.device_type !== undefined
          ? params?.device_type
          : user.device_type,
      stream_live_license:
        params?.stream_live_license !== undefined
          ? params?.stream_live_license
          : user.stream_live_license,
      socket_connection_id:
        params?.socket_connection_id !== undefined
          ? params?.socket_connection_id
          : user.socket_connection_id,
    };

    let updateUserProfile = await Users.update(
      update,
      {
        where: { user_id: user.user_id },
      },
      { transaction: t }
    );

    if (updateUserProfile) {
      updateUserProfile = await Users.findOne(
        { where: { user_id: user.user_id } },
        { transaction: t }
      );
    }

    return updateUserProfile.toJSON();
  },

  /* Delete user profile details */
  deleteUser: async (userId, t) => {
    const { Users } = await connectToDatabase();
    let deletedUser = await Users.destroy(
      { where: { user_id: userId } },
      { transaction: t }
    );

    return deletedUser;
  },

  /* Edit user profile details */
  deleteUserProfile: async (userId, t) => {
    const { Users } = await connectToDatabase();
    let deletedUserProfile = await Users.update(
      { status: "inactive" },
      { where: { user_id: userId } },
      { transaction: t }
    );

    return deletedUserProfile;
  },

  /* Fetch all the user's details */
  getAllUsers: async (user, filter, t) => {
    const { Users, Customers, RoomsInTeacher, Room } =
      await connectToDatabase();
    let {
      pageNumber = 0,
      pageSize = 10,
      searchBy = "",
      location = "All",
      role = "All",
      liveStreaming = "All",
      cust_id = null,
    } = filter;
    let streamValue = [true, false];
    if (location == "All") {
      location = "";
    }

    if (role == "All") {
      role = "";
    }

    if (liveStreaming == "Yes") {
      streamValue = [true];
    }

    if (liveStreaming == "No") {
      streamValue = [false];
    }

    let allusers = await Users.findAll({
      where: {
        cust_id: user.cust_id || cust_id,
        user_id: {
          [Sequelize.Op.not]: user.user_id,
        },
        stream_live_license: { [Sequelize.Op.in]: streamValue },
        [Sequelize.Op.or]: [
          {
            first_name: {
              [Sequelize.Op.like]: `%${searchBy}%`,
            },
          },
          {
            last_name: {
              [Sequelize.Op.like]: `%${searchBy}%`,
            },
          },
          {
            email: {
              [Sequelize.Op.like]: `%${searchBy}%`,
            },
          },
        ],
        location: {
          [Sequelize.Op.substring]: location,
        },
        role: {
          [Sequelize.Op.substring]: role,
        },
      },
      attributes: ["user_id", "location"],
    });

    const userIds = [];

    if(!user.cust_id){
      let availableLocations = await customerServices.getLocationDetails(cust_id)
      let locs = availableLocations.flatMap((i) => i.loc_name);
      allusers.map((item) => {
        locs.forEach((i) => {
          if (item.location.accessable_locations.includes(i)) {
            userIds.push(item);
          }
        });
      });
    }
    else{
      allusers.map((item) => {
        user.location.accessable_locations.forEach((i) => {
          if (item.location.accessable_locations.includes(i)) {
            userIds.push(item);
          }
        });
      });
    }

    let users = await Users.findAndCountAll({
      limit: parseInt(pageSize),
      offset: parseInt(pageNumber * pageSize),
      where: {
        user_id: { [Sequelize.Op.in]: userIds.flatMap((i) => i.user_id) },
      },
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["max_stream_live_license"],
        },
        {
          model: RoomsInTeacher,
          as: "roomsInTeacher",
          include: [
            {
              model: Room,
              as: "room",
            },
          ],
        },
      ],
      attributes: { exclude: ["password"] },
    });

    return { users: users.rows, count: users.count };
  },

  // check if user already exist for given email
  checkEmailExist: async (email, t) => {
    const { Users, Family } = await connectToDatabase();
    const users = await Users.findOne(
      { where: { email: email } },
      { transaction: t }
    );

    const families = await Family.findOne(
      { where: { email: email } },
      { transaction: t }
    );

    if (users === null && families === null) {
      return false;
    } else {
      return true;
    }
  },
  getAllUsersForLocation: async (custId, locations) => {
    const { Users } = await connectToDatabase();
    let locArray = locations?.map((loc) => {
      return {
        location: {
          [Sequelize.Op.substring]: loc,
        },
      };
    });
    let users = await Users.findAll({
      where: { cust_id: custId, [Sequelize.Op.or]: locArray },
      attributes: ["first_name", "last_name", "user_id"],
      paranoid: false,
    });

    return users;
  },

  assignRoomsToTeacher: async (teacherId, rooms, t) => {
    const { RoomsInTeacher } = await connectToDatabase();
    const roomsToadd = rooms.map((room) => {
      return {
        room_id: room.room_id,
        teacher_id: teacherId,
      };
    });

    let roomsAdded = await RoomsInTeacher.bulkCreate(
      roomsToadd,
      { returning: true },
      { transaction: t }
    );

    return roomsAdded;
  },

  editAssignedRoomsToTeacher: async (teacherId, rooms, t) => {
    const { RoomsInTeacher } = await connectToDatabase();
    const roomsToadd = rooms.map((room) => {
      return {
        room_id: room.room_id,
        teacher_id: teacherId,
      };
    });

    let roomsRemoved = await RoomsInTeacher.destroy(
      { where: { teacher_id: teacherId }, raw: true },
      { transaction: t }
    );

    let roomsAdded = await RoomsInTeacher.bulkCreate(roomsToadd, {
      transaction: t,
    });

    return roomsAdded;
  },
};
