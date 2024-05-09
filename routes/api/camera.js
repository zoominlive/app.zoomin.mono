const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const cameraController = require('../../controllers/cameras');
const { withAuthentication } = require('@frontegg/client');

/* Camera end points */
router.get('/', withAuthentication(), authController, cameraController.getAllCameras);
router.post('/add', withAuthentication(), authController, cameraController.createCamera);
router.put('/edit', withAuthentication(), authController, cameraController.editCamera);
router.delete('/delete', withAuthentication(), authController, cameraController.deleteCamera);
router.post('/fix-camera', withAuthentication(), authController, cameraController.fixCamera);
router.get('/generate-thumbnail', withAuthentication(), authController, cameraController.generateThumbnail);

module.exports = router;
