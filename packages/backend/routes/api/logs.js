const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const logsController = require('../../controllers/logs');
const { withAuthentication } = require('@frontegg/client');

/* logs endpoints */
router.post('/', withAuthentication(), authController, logsController.getAllLogs);

module.exports = router;
