const express = require('express');
const { withAuthentication } = require('@frontegg/client');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const dashboardController = require('../../controllers/dashboard');

/* dashboard end points */
router.get('/', withAuthentication(), authController, dashboardController.getStreamStatistics);
router.post('/setPreference', withAuthentication(), authController, dashboardController.setCamPreference);

module.exports = router;
