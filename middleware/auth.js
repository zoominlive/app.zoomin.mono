const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/index');

const CONSTANTS = require('../lib/constants');
const { IdentityClient } = require('@frontegg/client');
const identityClient = new IdentityClient({ FRONTEGG_CLIENT_ID: 'abff20d3-c32c-43b9-ada5-7c56a9349a7b', FRONTEGG_API_KEY: '05200ba2-93e1-456c-baee-80a1e2614a92' });

// authentication middleware to check auth and give access based on user type
module.exports = async function (req, res, next) {
  // console.log('req-->', req.frontegg.user);
  const { Family, Child, Users, Customers } = await connectToDatabase();
  try {
    const token = req.header('Authorization')?.substring(7);
    if (!token) {
      return res.status(401).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.AUTH_ERROR });
    } else {
      // const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
      const decodeToken = await identityClient.validateIdentityOnToken(token);
      // console.log('decodeToken-->', decodeToken);
      let user;
      let cust;
      // console.log('decodeToken.metadata.zoomin_user_id-->', decodeToken.metadata.zoomin_user_id);
      const user_id = decodeToken.metadata.zoomin_user_id;
      // console.log('user_id-->', user_id);
      if (user_id) {
        // console.log('----query----');
        user = await Users.findOne({ where: { user_id: user_id } });
        // console.log('user-->', user);
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
