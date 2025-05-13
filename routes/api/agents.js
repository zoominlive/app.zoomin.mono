const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const agentController = require('../../controllers/agents');
const { withAuthentication } = require('@frontegg/client');
const containerMetrics = require('../../controllers/containerMetrics');

/* API Key end points */
router.get('/', withAuthentication(), authController, agentController.getAllAgents);
router.get('/:agentId', withAuthentication(), authController, agentController.getAgentById);
router.post('/create', agentController.createAgent);
router.post('/:agentId/metrics', containerMetrics.createContainerMetric);
router.post('/bulk-create', containerMetrics.bulkCreateContainerMetrics);
router.put('/update/:agentId', withAuthentication(), authController, agentController.updateAgent);
router.delete('/delete/:agentId', withAuthentication(), authController, agentController.deleteAgent);

module.exports = router;
