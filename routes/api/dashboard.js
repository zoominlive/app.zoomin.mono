const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const dashboardController = require('../../controllers/dashboard');

/* dashboard end points */
router.get('/', authController, dashboardController.getStreamStatistics);

module.exports = router;
