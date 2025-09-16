const express = require('express');

const router = express.Router();

/* Required Controllers */
const apiKeyController = require('../../controllers/apiKey');

/* API Key end points */
router.get('/list', apiKeyController.getApiKeyList);
router.get('/get-latest-record', apiKeyController.getLatestRecord);
router.post('/create', apiKeyController.createApiKey);
router.put('/edit', apiKeyController.editApiKey);
router.patch('/change-status', apiKeyController.changeApiKeyStatus);
router.delete('/delete', apiKeyController.deleteApiKey);
router.post('/validate', apiKeyController.validateApiKey);
router.post('/exchange-token', apiKeyController.getToken);
router.post('/get-new-jwt', apiKeyController.getNewJWTToken);

module.exports = router;
