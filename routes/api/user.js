const express = require('express');
const { withAuthentication } = require('@frontegg/client');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const userController = require('../../controllers/users');

/* User end points */
router.get('/', withAuthentication(), authController, userController.getUserDetails);
router.post('/create-user', withAuthentication(), authController, userController.createUser);
router.get('/all', withAuthentication(), authController, userController.getAllUserDetails);
router.get('/frontegg-details', withAuthentication(), authController, userController.getFronteggUserDetails);
router.post('/resend-invite', withAuthentication(), authController, userController.resendInviteToUser);
router.post('/login', userController.loginUser);
router.put('/changePassword', withAuthentication(), authController, userController.changePassword);
router.post('/setPassword', userController.validateUser);
router.put('/forgetPassword', userController.forgetPassword);
router.post('/upload-image', withAuthentication(), authController, userController.uploadImage);
router.delete('/delete-image', withAuthentication(), authController, userController.deleteImage);
router.put('/', withAuthentication(), authController, userController.updateUserProfile);
router.delete('/delete', withAuthentication(), authController, userController.deleteUser);
router.put('/edit', withAuthentication(), authController, userController.editUser);
router.delete('/', withAuthentication(), authController, userController.deleteUserProfile);
router.post('/emailChange', userController.changeRegisteredEmail);
router.post('/checkLinkValid', userController.checkLinkValid);
router.post('/emailValidation', withAuthentication(), authController, userController.isEmailExist);
router.get('/location', withAuthentication(), authController, userController.getAllUsersForLocation);
router.post('/send-notification', withAuthentication(), authController, userController.sendNotification);
router.post('/enable', withAuthentication(), authController, userController.enableUser);
router.post('/disable', withAuthentication(), authController, userController.disableUser);
module.exports = router;
