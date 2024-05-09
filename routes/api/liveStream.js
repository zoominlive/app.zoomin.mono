const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const liveStreamAuthController = require('../../middleware/live_stream_auth');
const LiveStreamController = require('../../controllers/liveStream');
const { withAuthentication } = require('@frontegg/client');

/* live stream end points */
router.get('/', withAuthentication(), authController, LiveStreamController.getEndpoint);
router.post('/start', withAuthentication(), liveStreamAuthController, LiveStreamController.startLiveStream);
router.post('/stop', withAuthentication(), liveStreamAuthController, LiveStreamController.stopLiveStream);
router.get('/details', withAuthentication(), LiveStreamController.getstreamDetails);
router.post('/reportViewer', withAuthentication(), LiveStreamController.addRecentViewers);

module.exports = router;