const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const familyController = require('../../controllers/families');
const { withAuthentication } = require('@frontegg/client');

/* family end points */
router.get('/', withAuthentication(), authController, familyController.getAllFamilyDetails);
router.post('/add', withAuthentication(), authController, familyController.createFamily);
router.put('/edit', withAuthentication(), authController, familyController.editFamily);
router.post('/add-secondary-family-member', withAuthentication(), authController, familyController.addParent);
router.put('/disable', withAuthentication(), authController, familyController.disableFamily);
router.put('/enable', withAuthentication(), authController, familyController.enableFamily);
router.delete('/delete', withAuthentication(), authController, familyController.deleteFamily);
router.post('/setPassword', familyController.validateFamilyMember);
router.post('/emailChange', familyController.changeRegisteredEmail);
router.post('/checkLinkValid', familyController.checkLinkValid);
router.get('/location', withAuthentication(), authController, familyController.getAllUsersForLocation);
router.delete('/delete-secondary-member', withAuthentication(), authController, familyController.deleteFamilyMember);
router.delete('/delete-primary-member', withAuthentication(), authController, familyController.deletePrimaryFamilyMember);
module.exports = router;
