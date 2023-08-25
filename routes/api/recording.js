const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const RecordingsController = require('../../controllers/recordings');

/*recordings end points */
router.get('/', authController, RecordingsController.getAllRecordings);

module.exports = router;