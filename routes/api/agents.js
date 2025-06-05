const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const agentMiddleware = require('../../middleware/agentAuth');
const agentController = require('../../controllers/agents');
const { withAuthentication } = require('@frontegg/client');
const containerMetrics = require('../../controllers/containerMetrics');
const containerController = require('../../controllers/container');

router.post('/register', agentMiddleware, agentController.createAgent);
router.put('/update/', agentMiddleware, agentController.updateAgent);
router.put('/update-agent-muxly-hostname', agentController.updateAgentMuxlyHostname);
router.post('/:agentId/metrics', agentMiddleware, containerMetrics.createContainerMetric);
router.get('/metrics/get-container-metrics', containerMetrics.getAllContainerMetrics);
// routes not in use
router.get('/', withAuthentication(), authController, agentController.getAllAgents);
router.get('/:agentId', withAuthentication(), authController, agentController.getAgentById);
router.post('/bulk-create', containerMetrics.bulkCreateContainerMetrics);
router.delete('/delete/:agentId', withAuthentication(), authController, agentController.deleteAgent);

// Container management endpoints
router.post('/restart', containerController.restartContainer);
router.post('/run-image', containerController.updateContainerImage);
router.post('/update-config', containerController.updateContainerConfig);
router.post('/update-muxly-hostname', containerController.updateMuxlyHostname);

module.exports = router;
