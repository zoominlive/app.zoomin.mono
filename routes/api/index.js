const express = require('express');

const router = express.Router();
const userRoutes = require('./user');
const roomRoutes = require('./room');
const cameraRoutes = require('./camera');

/* user routes */
router.use('/users', userRoutes);

/* room routes */
router.use('/rooms', roomRoutes);

/* camera routes */
router.use('/cams', cameraRoutes);

module.exports = router;
