const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const familyController = require('../../controllers/families');

/* family end points */
router.get('/', authController, familyController.getAllFamilyDetails);
router.post('/add', authController, familyController.createFamily);
router.put('/edit', authController, familyController.editFamily);
router.post('/addParent', authController, familyController.addParent);
router.put('/disable', authController, familyController.disableFamily);
router.put('/enable', authController, familyController.enableFamily);
router.delete('/delete', authController, familyController.deleteFamily);
router.post('/setPassword', familyController.validateFamilyMember);
router.post('/emailChange', familyController.changeRegisteredEmail);
router.post('/checkLinkValid', familyController.checkLinkValid);
router.get('/location', authController, familyController.getAllUsersForLocation);
router.delete('/delete-member', authController, familyController.deleteFamilyMember);
module.exports = router;
