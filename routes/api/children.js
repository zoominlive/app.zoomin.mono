const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const childController = require('../../controllers/children');

/* Child end points */

router.post('/add', authController, childController.createChild);
router.put('/edit', authController, childController.editChild);
router.put('/disable', authController, childController.disableChild);
router.put('/enable', authController, childController.enableChild);
router.delete('/delete', authController, childController.deleteChild);
router.post('/addroom', authController, childController.addRoomInChild);
router.delete('/deleteroom', authController, childController.deleteRoomInChild);
router.put('/roomschedule', authController, childController.changeRoomScheduler);

module.exports = router;
