const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const logsController = require('../../controllers/logs');

/* room end points */
router.get('/', authController, logsController.getAllLogs);

module.exports = router;
