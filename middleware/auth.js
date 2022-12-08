const jwt = require('jsonwebtoken');
const { Family, Child } = require('../models');
const Users = require('../models/users');
const CONSTANTS = require('../lib/constants');
// authentication middleware to check auth and give access based on user type
module.exports = async function (req, res, next) {
  try {
    const token = req.header('Authorization')?.substring(7);
    if (!token)
      return res.status(401).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.AUTH_ERROR });

    const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let user;
    if (decodeToken?.user_id) {
      user = await Users.findOne({ where: { user_id: decodeToken?.user_id } });
    }
    if (!user) {
      if (decodeToken?.family_member_id) {
        let familyUser;
        familyUser = await Family.findOne({
          where: { family_member_id: decodeToken?.family_member_id },
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
      req.userToken = token;
      req.user = user.toJSON();
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
