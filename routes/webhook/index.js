const express = require('express');

const router = express.Router();

const webhookController = require('../../controllers/webhooksController');
/* user routes */
router.post('/subscription', webhookController);

module.exports = router;
