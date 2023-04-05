const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const liveStreamAuthController = require('../../middleware/live_stream_auth');
const LiveStreamController = require('../../controllers/liveStream');

/* live stream end points */
router.get('/', authController, LiveStreamController.getEndpoint);
router.post('/start', liveStreamAuthController, LiveStreamController.startLiveStream);
router.post('/stop', liveStreamAuthController, LiveStreamController.stopLiveStream);

module.exports = router;