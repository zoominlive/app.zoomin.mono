const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const cameraController = require('../../controllers/cameras');

/* Camera end points */
router.get('/', authController, cameraController.getAllCameras);
router.post('/add', authController, cameraController.createCamera);
router.put('/edit', authController, cameraController.editCamera);
router.delete('/delete', authController, cameraController.deleteCamera);

module.exports = router;
