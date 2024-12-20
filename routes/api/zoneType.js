const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const zoneTypeController = require('../../controllers/zoneType');
const { withAuthentication } = require('@frontegg/client');

/* room end points */
router.get('/', withAuthentication(), authController, zoneTypeController.getAllZoneTypeDetails);
router.post('/add', withAuthentication(), authController, zoneTypeController.createZoneType);
router.put('/edit', withAuthentication(), authController, zoneTypeController.editZoneType);
router.delete('/delete', withAuthentication(), authController, zoneTypeController.deleteZoneType);

module.exports = router;
