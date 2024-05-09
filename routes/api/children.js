const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const childController = require('../../controllers/children');
const { withAuthentication } = require('@frontegg/client');

/* Child end points */

router.post('/add', withAuthentication(), authController, childController.createChild);
router.put('/edit', withAuthentication(), authController, childController.editChild);
router.put('/disable', withAuthentication(), authController, childController.disableChild);
router.put('/enable', withAuthentication(), authController, childController.enableChild);
router.delete('/delete', withAuthentication(), authController, childController.deleteChild);
router.post('/addroom', withAuthentication(), authController, childController.addRoomInChild);
router.delete('/deleteroom', withAuthentication(), authController, childController.deleteRoomInChild);
router.put('/roomschedule', withAuthentication(), authController, childController.changeRoomScheduler);
router.put('/schedule/edit', withAuthentication(), authController, childController.changeDefaultRoomScheduler);
router.get('/schedule', withAuthentication(), authController, childController.getScheduleDetails);

module.exports = router;
