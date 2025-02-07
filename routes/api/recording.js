const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const RecordingsController = require('../../controllers/recordings');
const { withAuthentication } = require('@frontegg/client');

/*recordings end points */
router.get('/', withAuthentication(), authController, RecordingsController.getAllRecordings);
router.get('/recordings-by-user', withAuthentication(), authController, RecordingsController.getAllRecordingsByUser);
router.put('/edit', withAuthentication(), authController, RecordingsController.editRecording);
router.put('/edit-mobile-stream', withAuthentication(), authController, RecordingsController.editMobileRecording);
router.delete('/delete', withAuthentication(), authController, RecordingsController.deleteRecording);
router.delete('/delete-mobile-stream', withAuthentication(), authController, RecordingsController.deleteMobileRecording);

module.exports = router;