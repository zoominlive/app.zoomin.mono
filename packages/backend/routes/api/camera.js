const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const cameraController = require('../../controllers/cameras');
const { withAuthentication } = require('@frontegg/client');

/* Camera end points */
router.get('/', withAuthentication(), authController, cameraController.getAllCameras);
router.get('/get-all-cams-transcoder', cameraController.getAllCamerasForTranscoder);
router.post('/add', withAuthentication(), authController, cameraController.createCamera);
router.post('/start-recording', withAuthentication(), authController, cameraController.startCameraRecording);
router.post('/stop-recording', withAuthentication(), authController, cameraController.stopCameraRecording);
router.put('/edit-recording', withAuthentication(), authController, cameraController.editCameraRecording);
router.post('/add-record-tag', withAuthentication(), authController, cameraController.addRecordTag);
router.put('/edit-record-tag', withAuthentication(), authController, cameraController.editRecordTag);
router.delete('/delete-record-tag', withAuthentication(), authController, cameraController.deleteRecordTag);
router.get('/list-record-tags', withAuthentication(), authController, cameraController.listRecordTags);
router.put('/edit', withAuthentication(), authController, cameraController.editCamera);
router.delete('/delete', withAuthentication(), authController, cameraController.deleteCamera);
router.post('/fix-camera', withAuthentication(), authController, cameraController.fixCamera);
router.get('/generate-thumbnail', withAuthentication(), authController, cameraController.generateThumbnail);

module.exports = router;
