const connectToDatabase = require("../models/index");
const Sequelize = require("sequelize");
const sequelize = require("../lib/database");
const jwt = require("jsonwebtoken");
const encrypter = require("object-encrypter");
const engine = encrypter(process.env.JWT_SECRET_KEY, { ttl: true });
const _ = require("lodash");
const { v4: uuidv4 } = require("uuid");

var validator = require("validator");
const ZonesInTeacher = require("../models/zones_assigned_to_teacher");
const customerServices = require('../services/customers');
const { default: axios } = require("axios");
const Users = require("../models/users");
const CustomerLocations = require("../models/customer_locations");
const CustomerLocationAssignments = require("../models/customer_location_assignment");
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
    delete userObj.zones;
    console.log("userObj--->", userObj);
    let userCreated = await Users.create(userObj, { transaction: t });

    const camsToAdd = userObj.location.locations.map((_) => {
      return {
        loc_id: _.loc_id,
        cust_id: userObj.cust_id,
        user_id: userCreated.user_id
      };
    });
    console.log('camsToAdd==>', camsToAdd);
    
    await CustomerLocationAssignments.bulkCreate(camsToAdd, {
      transaction: t,
    });
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
        let emailCheck = await Users.findOne({
          where: { email: params.email },
        });

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
  getUserById: async (userId) => {
    const { Users } = await connectToDatabase();
    let user = await Users.findOne({
      where: { user_id: userId },
    });
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
    const duration = registerFlag ? 60 * 1000 * 60 * 96 : 604800000;
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
      259200000 // equals to 3 days. earlier it was 15 mins which is 900000 milliseconds
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
      // location: params?.location !== undefined ? locations : user.location,
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
      dashboard_locations: params?.dashboard_locations,
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

    if(params.location) {
      const locationsToAdd = params.location.locations.map((loc) => {
        return {
          loc_id: loc.loc_id,
          cust_id: user.cust_id,
          user_id: user.user_id
        };
      });
  
      // await CustomerLocationAssignments.destroy(
      //   {
      //     where: { user_id: user.user_id },
      //     raw: true,
      //   },
      //   { transaction: t }
      // );
      
      await CustomerLocationAssignments.bulkCreate(locationsToAdd, {
        transaction: t,
      });

      const userLocations = await Users.findOne({
        where: {
          user_id: user.user_id
        },
        include: [
          {
            model: CustomerLocations,
            as: 'locations',
            attributes: ['loc_id', 'loc_name']
          }
        ],
        transaction: t
      })   
      updateUserProfile.dataValues.locations = userLocations.toJSON().locations.map((item) => ({loc_id: item.loc_id, loc_name: item.loc_name})); 
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
    
    await CustomerLocationAssignments.destroy(
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
    const { Users, Customers, ZonesInTeacher, Zone, CustomerLocations } = await connectToDatabase();
    
    let {
      pageNumber = 0,
      pageSize = 10,
      searchBy = "",
      location = [],
      role = "All",
      liveStreaming = "All",
      cust_id = null,
    } = filter;
  
    let streamValue = [true, false];
  
    if (liveStreaming === "Yes") {
      streamValue = [true];
    } else if (liveStreaming === "No") {
      streamValue = [false];
    }
  
    // Handle location filtering
    let locationFilter = {};
    if (location.length > 0 && !location.includes("All")) {
      locationFilter = { loc_id: { [Sequelize.Op.in]: location } };
    }
  
    // Handle role filtering
    let roleFilter = {};
    if (role !== "All") {
      roleFilter = { role: { [Sequelize.Op.substring]: role } };
    }
  
    // Get all users based on initial conditions
    let allusers = await Users.findAll({
      where: {
        cust_id: user.cust_id || cust_id,
        user_id: { [Sequelize.Op.not]: user.user_id },
        stream_live_license: { [Sequelize.Op.in]: streamValue },
        ...roleFilter,
        [Sequelize.Op.or]: [
          { first_name: { [Sequelize.Op.like]: `%${searchBy}%` } },
          { last_name: { [Sequelize.Op.like]: `%${searchBy}%` } },
          { email: { [Sequelize.Op.like]: `%${searchBy}%` } },
        ],
      },
      attributes: ["user_id"],
      include: [
        {
          model: CustomerLocations,
          as: "locations",
          where: locationFilter, // Dynamic location filter
          attributes: ["loc_id", "loc_name"],
        },
      ],
      distinct: true,
    });
  
    let userIds = new Set(); // Use a Set to store unique user IDs
  
    if (!user.cust_id) {
      let availableLocations = await customerServices.getLocationDetails(cust_id);
      let locIds = availableLocations.map(({ loc_id }) => loc_id);
  
      allusers.forEach((user) => {
        if (user.locations.some((loc) => locIds.includes(loc.loc_id))) {
          userIds.add(user.user_id);
        }
      });
    } else {
      let userLocIds = user.locations.map(({ loc_id }) => loc_id);
  
      allusers.forEach((user) => {
        if (user.locations.some((loc) => userLocIds.includes(loc.loc_id))) {
          userIds.add(user.user_id);
        }
      });
    }
  
    // Fetch users with pagination
    let users = await Users.findAndCountAll({
      limit: parseInt(pageSize),
      offset: parseInt(pageNumber * pageSize),
      where: {
        user_id: { [Sequelize.Op.in]: Array.from(userIds) }, // Convert Set to array
      },
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["max_stream_live_license"],
        },
        {
          model: ZonesInTeacher,
          as: "zonesInTeacher",
          include: [{ model: Zone, as: "zone" }],
        },
        {
          model: CustomerLocations,
          as: "locations",
          where: locationFilter,
          attributes: ["loc_id", "loc_name"],
        },
      ],
      distinct: true,
      attributes: { exclude: ["password"] },
    });
  
    return { users: users.rows, count: users.count };
  },

  getAllUserIds: async (custId, location = ["Select All"], t) => {
    const { Users, CustomerLocations } = await connectToDatabase();
    const distinctUserIds = await Users.findAll({
      where: { cust_id: custId },
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("user_id")), "user_id"]
      ],
      raw: true,
      transaction: t
    });
    
    const userIdsArray = distinctUserIds.map(user => user.user_id);
    
    let userIdsWithLocations = await Users.findAll({
      where: { user_id: userIdsArray },
      include: [
        {
          model: CustomerLocations,
          as: "locations",
        },
      ],
      transaction: t,
    });

    if (!location.includes("Select All")) {
      let filterResult = []; 
      location = location.map(Number);    
      userIdsWithLocations.map((i) => {        
        if (
          i.locations?.map((item) => item.dataValues.loc_id).every((it) => location.includes(it))
        ) {
          filterResult.push(i);
        }
      });
      userIdsWithLocations = filterResult;
    }
    
    return userIdsWithLocations;
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
    const { Users, CustomerLocations } = await connectToDatabase();
    let locArray = locations?.map((loc) => {
      return {
        loc_id: {
          [Sequelize.Op.substring]: loc,
        },
      };
    });
    let users = await Users.findAll({
      // where: { cust_id: custId, [Sequelize.Op.or]: locArray },
      attributes: ["first_name", "last_name", "user_id"],
      include: [{
        model: CustomerLocations,
        as: 'locations',
        where: { cust_id: custId, [Sequelize.Op.or]: locArray },
        attributes: ['loc_id', 'loc_name']
      }],
      paranoid: false,
    });
    console.log('users==>', users.length);
    
    return users;
  },

  assignZonesToTeacher: async (teacherId, zones, t) => {
    const { ZonesInTeacher } = await connectToDatabase();
    const zonesToadd = zones.map((zone) => {
      return {
        zone_id: zone.zone_id,
        teacher_id: teacherId,
      };
    });

    let zonesAdded = await ZonesInTeacher.bulkCreate(
      zonesToadd,
      { returning: true },
      { transaction: t }
    );

    return zonesAdded;
  },

  editAssignedZonesToTeacher: async (teacherId, zones, t) => {
    const { ZonesInTeacher } = await connectToDatabase();
    const zonesToadd = zones.map((zone) => {
      return {
        zone_id: zone.zone_id,
        teacher_id: teacherId,
      };
    });

    let zonesRemoved = await ZonesInTeacher.destroy(
      { where: { teacher_id: teacherId }, raw: true },
      { transaction: t }
    );

    let zonesAdded = await ZonesInTeacher.bulkCreate(zonesToadd, {
      transaction: t,
    });

    return zonesAdded;
  },

  getUsersSocketIds: async (cust_id) => {
    const { Users } = await connectToDatabase();
    let socketIds = await Users.findAll({
      where: {
        role: { [Sequelize.Op.notIn]: ["Teacher"] },
        cust_id: { [Sequelize.Op.or]: [cust_id, null] },
      },
      attributes: ["socket_connection_id", "dashboard_locations"],
      raw: true,
    });

    return socketIds;
  },

  createFrontEggUser: async (tenantId, userDetails) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const user_response = await axios.post(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/users/v1`,
        {
          name: userDetails.first_name + " " + userDetails.last_name,
          email: userDetails.email,
          roleIds: [userDetails.roleIds],
          metadata: JSON.stringify({
            zoomin_user_id: userDetails.user_id,
          }),
        },
        {
          headers: {
            "frontegg-tenant-id": `${tenantId}`,
            Authorization: `Bearer ${vendor_token.data.token}`,
          },
        }
      );

      return user_response.data;
    }
  },

  createFrontEggAppUser: async (tenantId, userDetails) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const user_response = await axios.post(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/users/v1`,
        {
          name: userDetails.name,
          email: userDetails.email,
        },
        {
          headers: {
            "frontegg-tenant-id": `${tenantId}`,
            Authorization: `Bearer ${vendor_token.data.token}`,
          },
        }
      );

      return user_response.data;
    }
  },

  updateFrontEggAppUser: async (tenantId, userDetails) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const user_response = await axios.put(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/users/v1`,
        {
          name: userDetails.name,
        },
        {
          headers: {
            "frontegg-tenant-id": `${tenantId}`,
            "frontegg-user-id": `${userDetails.frontegg_user_id}`,
            Authorization: `Bearer ${vendor_token.data.token}`,
          },
        }
      );

      return user_response.data;
    }
  },

  createFrontEggUserAccessToken: async (
    tenantId,
    frontegg_user_id,
    expiresIn
  ) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const token_response = await axios.post(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/users/access-tokens/v1`,
        {
          description: "Token for CLI calls",
          expiresInMinutes: 15,
        },
        {
          headers: {
            "frontegg-user-id": `${frontegg_user_id}`,
            "frontegg-tenant-id": `${tenantId}`,
            Authorization: `Bearer ${vendor_token.data.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return token_response.data.secret;
    }
  },

  createNewJWTToken: async (refreshToken) => {
    console.log("refreshToken==>", refreshToken);

    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const token_response = await axios.post(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/auth/v2/api-token/token/refresh`,
        {
          refreshToken: refreshToken,
        },
        {
          headers: {
            Authorization: `Bearer ${vendor_token.data.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return token_response.data;
    }
  },

  enableUser: async (tenantId, userId) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const user_response = await axios.post(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/tenants/users/v1/${userId}/enable`,
        {},
        {
          headers: {
            "frontegg-tenant-id": `${tenantId}`,
            Authorization: `Bearer ${vendor_token.data.token}`,
          },
        }
      );
      return user_response;
    }
  },

  disableUser: async (tenantId, userId) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const user_response = await axios.post(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/tenants/users/v1/${userId}/disable`,
        {},
        {
          headers: {
            "frontegg-tenant-id": `${tenantId}`,
            Authorization: `Bearer ${vendor_token.data.token}`,
          },
        }
      );
      return user_response;
    }
  },

  editFrontEggUserEmail: async (userDetails) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const user_response = await axios.put(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/users/v1/${userDetails.frontegg_user_id}/email`,
        {
          email: userDetails.email,
        },
        {
          headers: {
            Authorization: `Bearer ${vendor_token.data.token}`,
          },
        }
      );

      return user_response.data;
    }
  },

  removeFrontEggUser: async (userId) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const user_response = await axios.delete(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/users/v1/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${vendor_token.data.token}`,
          },
        }
      );
    }
  },

  createFrontEggFamilyUser: async (tenantId, userDetails) => {
    const vendor_token = await axios.post(
      `${process.env.FRONTEGG_API_GATEWAY_URL}auth/vendor/`,
      {
        clientId: process.env.FRONTEGG_CLIENT_ID,
        secret: process.env.FRONTEGG_API_KEY,
      }
    );
    if (vendor_token) {
      const user_response = await axios.post(
        `${process.env.FRONTEGG_API_GATEWAY_URL}identity/resources/users/v1`,
        {
          name: userDetails.first_name + " " + userDetails.last_name,
          email: userDetails.email,
          roleIds: [userDetails.roleIds],
          metadata: JSON.stringify({
            zoomin_family_member_id: userDetails.family_member_id,
          }),
        },
        {
          headers: {
            "frontegg-tenant-id": `${tenantId}`,
            Authorization: `Bearer ${vendor_token.data.token}`,
          },
        }
      );
      return user_response.data;
    }
  },

  validateUser: async (user_id, userCustId, locations) => {
    try {
      const user = await Users.findOne({
        where: { user_id: user_id },
        include: [{
          model: CustomerLocations,
          as: 'locations',
          attributes: ['loc_id', 'loc_name']
        }],
      });
      console.log("user==>", user);

      if (!user) {
        return { valid: false, message: "User:" + user_id + " not found." };
      }
      if (user.cust_id !== userCustId) {
        return {
          valid: false,
          message: "Unauthorized access to user:" + user_id,
        };
      }
      if (locations && !locations.every(location => user.locations.map((item) => item.loc_id).includes(location))) {
        return {
          valid: false,
          message: "Unauthorized access to either of the locations",
        };
      }
      return { valid: true, message: "User is valid." };
    } catch (error) {
      console.error("Error validating user:", error);
      return { valid: false, message: "Error validating user." };
    }
  },
};
