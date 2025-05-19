const express = require('express');

const router = express.Router();
const userRoutes = require('./user');
const customerRoutes = require('./customer');
const zoneRoutes = require('./zone');
const zoneTypeRoutes = require('./zoneType');
const cameraRoutes = require('./camera');
const familyRoutes = require('./family');
const childRoutes = require('./children');
const dashboardRoutes = require('./dashboard');
const watchStreamRoutes = require('./watchStream');
const logRoutes = require('./logs');
const liveStreamRoutes = require('./liveStream');
const RecordingRoutes = require('./recording');
const PaymentRoutes = require('./payment');
const ApiKeyRoutes = require('./apiKey');
const AgentRoutes = require('./agents');
/* user routes */
router.use('/users', userRoutes);

/* customer routes */
router.use('/customers', customerRoutes);

/* zone routes || /zones changed to /zones due introduction of Zones concept */ 
router.use('/zones', zoneRoutes);

/* zone type routes */ 
router.use('/zone-type', zoneTypeRoutes);

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

/* liveStream routes */
router.use('/liveStream', liveStreamRoutes);

/* recordings routes */
router.use('/recordings', RecordingRoutes)

/* payment routes */
router.use('/payment', PaymentRoutes)

/* api-key routes */
router.use('/api-key', ApiKeyRoutes)

/* agents routes */
router.use('/agents', AgentRoutes);

module.exports = router;
