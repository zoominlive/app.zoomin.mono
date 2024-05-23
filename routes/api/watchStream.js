const express = require('express');
const { withAuthentication } = require('@frontegg/client');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const watchStreamController = require('../../controllers/watchStream');

/* Camera end points */
router.get('/', withAuthentication(), authController, watchStreamController.getAllCamForLocation);
router.get('/userStreams', withAuthentication(), authController, watchStreamController.getAllCamForUser);
router.post('/addviewer', withAuthentication(), authController, watchStreamController.addRecentViewers);
router.post('/setPreference', withAuthentication(), authController, watchStreamController.setUserCamPreference);
router.post('/reportViewer', watchStreamController.ReportViewers);
module.exports = router;
