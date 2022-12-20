const express = require('express');

const router = express.Router();
const userRoutes = require('./user');
const roomRoutes = require('./room');
const cameraRoutes = require('./camera');
const familyRoutes = require('./family');
const childRoutes = require('./children');
const dashboardRoutes = require('./dashboard');
const watchStreamRoutes = require('./watchStream');
const logRoutes = require('./logs');

/* user routes */
router.use('/users', userRoutes);

/* room routes */
router.use('/rooms', roomRoutes);

/* camera routes */
router.use('/cams', cameraRoutes);

/* family routes */
router.use('/family', familyRoutes);

/* child routes */
router.use('/family/child', childRoutes);

/* dashboard routes */
router.use('/dashboard', dashboardRoutes);

/* watchStream routes */
router.use('/watchstream', watchStreamRoutes);

/* logs routes */
router.use('/logs', logRoutes);

module.exports = router;
