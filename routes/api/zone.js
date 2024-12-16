const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const zoneController = require('../../controllers/zone');
const { withAuthentication } = require('@frontegg/client');

/* room end points */
router.get('/', withAuthentication(), authController, zoneController.getAllZoneDetails);
router.post('/add', withAuthentication(), authController, zoneController.createZone);
router.put('/edit', withAuthentication(), authController, zoneController.editZone);
router.delete('/delete', withAuthentication(), authController, zoneController.deleteZone);

module.exports = router;
