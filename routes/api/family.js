const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const familyController = require('../../controllers/families');

/* User end points */
router.get('/', authController, familyController.getAllFamilyDetails);
router.post('/add', authController, familyController.createFamily);
router.put('/edit', authController, familyController.editFamily);
router.post('/addParent', authController, familyController.addParent);
// router.post('/validEmail', authController, familyController.isEmailValid);
module.exports = router;
