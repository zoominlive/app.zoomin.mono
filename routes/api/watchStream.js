const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const watchStreamController = require('../../controllers/watchStream');

/* Camera end points */
router.get('/', authController, watchStreamController.getAllCamForLocation);
router.get('/userStreams', authController, watchStreamController.getAllCamForUser);
router.post('/addviewer', authController, watchStreamController.addRecentViewers);
router.post('/setPreference', authController, watchStreamController.setUserCamPreference);
router.post('/reportViewer', watchStreamController.ReportViewers);
module.exports = router;
