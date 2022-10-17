const express = require('express');

const router = express.Router();
const userRoutes = require('./user');
const roomRoutes = require('./room');
const cameraRoutes = require('./camera');
const familyroutes = require('./family');
/* user routes */
router.use('/users', userRoutes);

/* room routes */
router.use('/rooms', roomRoutes);

/* camera routes */
router.use('/cams', cameraRoutes);

/* camera routes */
router.use('/family', familyroutes);
module.exports = router;
