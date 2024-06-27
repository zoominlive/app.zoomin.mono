const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const RecordingsController = require('../../controllers/recordings');
const { withAuthentication } = require('@frontegg/client');

/*recordings end points */
router.get('/', withAuthentication(), authController, RecordingsController.getAllRecordings);

module.exports = router;