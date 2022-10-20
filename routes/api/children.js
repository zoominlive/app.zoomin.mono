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

module.exports = router;
