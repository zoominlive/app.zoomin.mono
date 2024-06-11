const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const cameraController = require('../../controllers/cameras');

/* Camera end points */
router.get('/', authController, cameraController.getAllCameras);
router.get('/get-all-cams-transcoder', cameraController.getAllCamerasForTranscoder);
router.post('/add', authController, cameraController.createCamera);
router.put('/edit', authController, cameraController.editCamera);
router.delete('/delete', authController, cameraController.deleteCamera);
router.post('/fix-camera', authController, cameraController.fixCamera);
router.get('/generate-thumbnail', authController, cameraController.generateThumbnail);

module.exports = router;
