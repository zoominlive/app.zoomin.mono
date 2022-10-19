const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const childController = require('../../controllers/children');

/* Child end points */

router.post('/add', authController, childController.createChild);
router.put('/edit', authController, childController.editChild);

module.exports = router;
