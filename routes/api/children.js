const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const childController = require('../../controllers/children');
const { withAuthentication } = require('@frontegg/client');

/* Child end points */

router.post('/add', authController, childController.createChild);
router.put('/edit', withAuthentication(), authController, childController.editChild);
router.put('/replace-zone', withAuthentication(), authController, childController.updateChildZone);
router.put('/disable', withAuthentication(), authController, childController.disableChild);
router.put('/enable', withAuthentication(), authController, childController.enableChild);
router.delete('/delete', withAuthentication(), authController, childController.deleteChild);
router.post('/addzone', withAuthentication(), authController, childController.addZoneInChild);
router.delete('/deletezone', withAuthentication(), authController, childController.deleteZoneInChild);
router.put('/zoneschedule', withAuthentication(), authController, childController.changeZoneScheduler);
router.put('/schedule/edit', withAuthentication(), authController, childController.changeDefaultZoneScheduler);
router.get('/schedule', withAuthentication(), authController, childController.getScheduleDetails);

module.exports = router;
