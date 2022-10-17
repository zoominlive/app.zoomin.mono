const express = require('express');

const router = express.Router();
const userRoutes = require('./user');
const roomRoutes = require('./room');
const cameraRoutes = require('./camera');
const familyRoutes = require('./family');
const childRoutes = require('./children');
/* user routes */
router.use('/users', userRoutes);

/* room routes */
router.use('/rooms', roomRoutes);

/* camera routes */
router.use('/cams', cameraRoutes);

/* family routes */
router.use('/family', familyRoutes);

router.use('/family/child', childRoutes);
module.exports = router;
