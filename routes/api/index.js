const express = require('express');

const router = express.Router();
const userRoutes = require('./user');
const roomRoutes = require('./room');

/* user routes */
router.use('/users', userRoutes);

/* room routes */
router.use('/rooms', roomRoutes);

module.exports = router;
