const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const zoneController = require('../../controllers/zones');
const { withAuthentication } = require('@frontegg/client');

/* zone endpoints */
router.get('/', withAuthentication(), authController, zoneController.getAllZonesDetails);
router.post('/add', withAuthentication(), authController, zoneController.createZone);
router.put('/edit', withAuthentication(), authController, zoneController.editZone);
router.put('/disable', withAuthentication(), authController, zoneController.disableZone);
router.put('/enable', withAuthentication(), authController, zoneController.enableZone);
router.delete('/delete', withAuthentication(), authController, zoneController.deleteZone);
router.get('/list', withAuthentication(), authController, zoneController.getAllZonesList);

module.exports = router;
