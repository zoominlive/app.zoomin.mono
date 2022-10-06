const jwt = require('jsonwebtoken');
const Users = require('../models/users');

module.exports = async function (req, res, next) {
  const token = req.header('Authorization')?.substring(7);
  if (!token) return res.status(401).json({ message: 'Auth Error' });

  try {
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await Users.findOne({ where: { user_id: decodeToken.user_id } });
    if (!user) {
      return res.status(401).json({ message: 'Auth Error' });
    }

    req.userToken = decodeToken.decodeToken;
    req.user = user.toJSON();

    next();
  } catch (e) {
    res.status(401).send({ message: 'Invalid Token' });
  }
};
