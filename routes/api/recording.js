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
router.post('/share', withAuthentication(), authController, RecordingsController.shareRecording);
router.patch('/mark-seen', withAuthentication(), authController, RecordingsController.markSeen);
router.get('/share-history', withAuthentication(), authController, RecordingsController.listShareHistory);
router.delete('/invalidate-link', withAuthentication(), authController, RecordingsController.invalidateLink);
router.get('/stream-video', withAuthentication(), authController, RecordingsController.streamVideo);
router.post('/report-issue', withAuthentication(), authController, RecordingsController.reportVideo);
router.post('/s3-to-cloudfront', RecordingsController.convertS3toCloudfront);

module.exports = router;