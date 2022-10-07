const jwt = require('jsonwebtoken');
const Users = require('../models/users');

module.exports = async function (req, res, next) {
  const token = req.header('Authorization')?.substring(7);
  if (!token) return res.status(401).json({ IsSuccess: true, Data: {}, Message: 'Auth Error' });

  try {
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await Users.findOne({ where: { user_id: decodeToken.user_id } });
    if (!user) {
      res.status(401).json({ IsSuccess: true, Data: {}, Message: 'Auth Error' });
    }

    req.userToken = decodeToken.decodeToken;
    req.user = user.toJSON();

    next();
  } catch (e) {
    res
      .status(401)
      .json({
        IsSuccess: true,
        Data: {},
        Message: 'Invalid Token or Token Expired, please Login again'
      });
  }
};
