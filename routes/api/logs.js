const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const logsController = require('../../controllers/logs');
const { withAuthentication } = require('@frontegg/client');

/* room end points */
router.post('/', withAuthentication(), authController, logsController.getAllLogs);

module.exports = router;
