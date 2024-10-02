const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/index');
const url = require('url');
const CONSTANTS = require('../lib/constants');
const { IdentityClient } = require('@frontegg/client');
const ApiKeys = require('../models/api_keys');
const identityClient = new IdentityClient({ FRONTEGG_CLIENT_ID: process.env.FRONTEGG_CLIENT_ID, FRONTEGG_API_KEY: process.env.FRONTEGG_API_KEY });

// authentication middleware to check auth and give access based on user type
module.exports = async function (req, res, next) {
  const { Family, Child, Users, Customers } = await connectToDatabase();
  try {
    const token = req.header('Authorization')?.substring(7);
    const xApiKey = req.header('x-api-key');
    const endpoint = req.originalUrl;
    if (!token && !xApiKey) {
      return res.status(401).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.AUTH_ERROR });
    } else {
      // const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY); //used earlier to verify token before Frontegg was integrated
      let decodeToken;
      let decodeXApiKey;
      if (token) {
        decodeToken = await identityClient.validateIdentityOnToken(token);
      } else if (xApiKey) {
        decodeXApiKey = await identityClient.validateToken(xApiKey, {roles: [], permissions: []}, 'AccessToken');
        console.log('decodeXApiKey==>', decodeXApiKey);
      }
      let user;
      let cust;
      // console.log('decodeToken.metadata.zoomin_user_id-->', decodeToken.metadata.zoomin_user_id);
      let user_id;
      if(decodeToken !== undefined) {
        user_id = decodeToken.metadata.zoomin_user_id;
      }
      let app_user_id;
      if(decodeXApiKey !== undefined) {
        app_user_id = decodeXApiKey.userId;
      }
      
      if(app_user_id && app_user_id !== undefined) {      
        const parsedUrl = url.parse(endpoint);
        const baseEndpoint = parsedUrl.pathname;

        let app = await ApiKeys.findOne({ where: { frontegg_user_id: app_user_id } });

        if (!app.dataValues.allowed_endpoints.includes(baseEndpoint)) {
          return res.status(403).json({ Message: 'API key does not have access to this endpoint' });
        }
        
        if (!app || app.dataValues.status == 'disabled') {
          return res.status(403).json({ Message: 'Invalid or inactive API key' });
        }
        req.user = app.dataValues;
      } else {
        if (user_id) {
          user = await Users.findOne({ where: { user_id: user_id } });
        }
        if (!user) {
          const family_member_id = decodeToken.metadata.zoomin_family_member_id;
          if (family_member_id) {
            let familyUser;
            familyUser = await Family.findOne({
              where: { family_member_id: family_member_id },
              include: [
                {
                  model: Child,
                  attributes: ['location']
                }
              ]
            });
  
            if (familyUser) {
              let locations = [];
              familyUser?.children?.forEach((child) => {
                child?.location?.locations?.forEach((location) => {
                  locations.push(location);
                });
              });
              locations = locations?.filter((v, i, a) => a.indexOf(v) === i);
              req.userToken = token;
              req.user = familyUser.toJSON();
              req.user.accessable_locations = req.user.location;
              req.user.location = { selected_locations: locations, accessable_locations: locations };
            } else {
              res.status(401).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.AUTH_ERROR });
            }
          } else {
            return res.status(401).json({
              IsSuccess: true,
              Data: {},
              Message: CONSTANTS.INVALID_TOKEN
            });
          }
        } else {
          if(user.role === 'Admin') {
            cust = await Customers.findOne({ where: { cust_id: user.cust_id } });
            user.dataValues.stripe_cust_id = cust.dataValues.stripe_cust_id;
            req.userToken = token;
            req.user = user.toJSON();
          }
          req.userToken = token;
          req.user = user.toJSON();
         
        }
      }
    }

    next();
  } catch (e) {
    console.log('error_log : ', e);
    return res.status(401).json({
      IsSuccess: true,
      Data: { error: e },
      Message: CONSTANTS.INVALID_TOKEN
    });
  }
};
