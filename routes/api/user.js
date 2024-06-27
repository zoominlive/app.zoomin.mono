const express = require('express');
const { withAuthentication } = require('@frontegg/client');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const userController = require('../../controllers/users');

/* User end points */
router.get('/', withAuthentication(), authController, userController.getUserDetails);
router.post('/createUser', withAuthentication(), authController, userController.createUser);
router.get('/all', withAuthentication(), authController, userController.getAllUserDetails);
router.post('/login', userController.loginUser);
router.put('/changePassword', withAuthentication(), authController, userController.changePassword);
router.post('/setPassword', userController.validateUser);
router.put('/forgetPassword', userController.forgetPassword);
router.post('/uploadImage', withAuthentication(), authController, userController.uploadImage);
router.delete('/deleteImage', withAuthentication(), authController, userController.deleteImage);
router.put('/', withAuthentication(), authController, userController.updateUserProfile);
router.delete('/delete', withAuthentication(), authController, userController.deleteUser);
router.put('/edit', withAuthentication(), authController, userController.editUser);
router.delete('/', withAuthentication(), authController, userController.deleteUserProfile);
router.post('/emailChange', userController.changeRegisteredEmail);
router.post('/checkLinkValid', userController.checkLinkValid);
router.post('/emailValidation', withAuthentication(), authController, userController.isEmailExist);
router.get('/location', withAuthentication(), authController, userController.getAllUsersForLocation);
router.post('/send-notification', withAuthentication(), authController, userController.sendNotification);
module.exports = router;
