const jwt = require('jsonwebtoken');
const { Family } = require('../models');
const Users = require('../models/users');
const CONSTANTS = require('../lib/constants');
// authentication middleware to check auth and give access based on user type
module.exports = async function (req, res, next) {
  const token = req.header('Authorization')?.substring(7);
  if (!token)
    return res.status(401).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.AUTH_ERROR });

  try {
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    let user;
    if (decodeToken?.user_id) {
      user = await Users.findOne({ where: { user_id: decodeToken.user_id } });
    }
    if (!user) {
      const familyUser = await Family.findOne({
        where: { family_member_id: decodeToken.family_member_id }
      });
      if (familyUser) {
        req.userToken = token;
        req.user = familyUser.toJSON();
      } else {
        res.status(401).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.AUTH_ERROR });
      }
    } else {
      req.userToken = token;
      req.user = user.toJSON();
    }

    next();
  } catch (e) {
    res.status(401).json({
      IsSuccess: true,
      Data: {},
      Message: CONSTANTS.INVALID_TOKEN
    });
  }
};
