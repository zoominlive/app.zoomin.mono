const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const userController = require('../../controllers/users');

/* User end points */
router.get('/', authController, userController.getUserDetails);
router.post('/createUser', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/changePassword', authController, userController.changePassword);
router.post('/authentication', userController.validateUser);
router.put('/resendVerificationCode', userController.resendSecurityCode);
router.put('/forgetPassword', userController.forgetPassword);
router.post('/uploadImage', authController, userController.uploadImage);
router.delete('/deleteImage', authController, userController.deleteImage);
router.put('/', authController, userController.updateUserProfile);
router.delete('/', authController, userController.deleteUserProfile);

module.exports = router;
