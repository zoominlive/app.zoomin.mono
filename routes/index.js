let express = require('express');

let router = express.Router();
const apiRouter = require('./api/index');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.status(200).json({ Message: 'Welcome to zoomin' });
});

/* GET all api routes */
router.use('/api', apiRouter);

module.exports = router;
