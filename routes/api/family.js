const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const familyController = require('../../controllers/families');

/* User end points */
// router.post('/', authController, familyController.getFamilyDetails);
router.post('/add', authController, familyController.createFamily);
// router.put('/edit', authController, familyController.editFamily);
// router.delete('/delete', authController, familyController.deleteFamily);
// router.post('/validEmail', authController, familyController.isEmailValid);
module.exports = router;
