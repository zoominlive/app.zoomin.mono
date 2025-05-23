const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const agentMiddleware = require('../../middleware/agentAuth');
const agentController = require('../../controllers/agents');
const { withAuthentication } = require('@frontegg/client');
const containerMetrics = require('../../controllers/containerMetrics');

router.post('/register', agentMiddleware, agentController.createAgent);
router.put('/update/', agentMiddleware, agentController.updateAgent);
router.post('/:agentId/metrics', agentMiddleware, containerMetrics.createContainerMetric);
router.get('/metrics/get-container-metrics', containerMetrics.getAllContainerMetrics);
// routes not in use
router.get('/', withAuthentication(), authController, agentController.getAllAgents);
router.get('/:agentId', withAuthentication(), authController, agentController.getAgentById);
router.post('/bulk-create', containerMetrics.bulkCreateContainerMetrics);
router.delete('/delete/:agentId', withAuthentication(), authController, agentController.deleteAgent);

module.exports = router;
