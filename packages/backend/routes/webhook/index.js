const express = require('express');

const router = express.Router();

const webhookController = require('../../controllers/webhooksController');
/* user routes */
router.post('/subscription', webhookController.webhookController);
router.post('/recordings', webhookController.recordingsWebhookController);

module.exports = router;
