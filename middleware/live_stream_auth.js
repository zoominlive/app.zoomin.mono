const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/index');

const CONSTANTS = require('../lib/constants');
// live_stream authentication middleware 
module.exports = async function (req, res, next) {
  const { LiveStreams } = await connectToDatabase();

  try {
    const token = req.header('Authorization')?.substring(7);
  
    if (!token) {
      return res.status(401).json({ IsSuccess: true, Data: {}, Message: CONSTANTS.AUTH_ERROR });
    } else {
      const decodeToken = jwt.verify(token, process.env.LIVE_STREAM_SECRET_KEY);
      let user;
      if (decodeToken?.stream_id) {
        user = await LiveStreams.findOne({ where: { stream_id: decodeToken?.stream_id } });
      }
      if (!user) {
        return res.status(401).json({
            IsSuccess: true,
            Data: {},
            Message: CONSTANTS.INVALID_TOKEN
          });
      } else {
        req.userToken = token;
        req.user = user.toJSON();
        // next();
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