const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const userController = require('../../controllers/users');

/* User end points */
router.get('/', authController, userController.getUserDetails);
router.post('/createUser', authController, userController.createUser);
router.get('/all', authController, userController.getAllUserDetails);
router.post('/login', userController.loginUser);
router.put('/changePassword', authController, userController.changePassword);
router.post('/setPassword', userController.validateUser);
router.put('/forgetPassword', userController.forgetPassword);
router.post('/uploadImage', authController, userController.uploadImage);
router.delete('/deleteImage', authController, userController.deleteImage);
router.put('/', authController, userController.updateUserProfile);
router.delete('/delete', authController, userController.deleteUser);
router.put('/edit', authController, userController.editUser);
router.delete('/', authController, userController.deleteUserProfile);
router.post('/emailChange', userController.changeRegisteredEmail);
router.post('/checkLinkValid', userController.checkLinkValid);
router.post('/emailValidation', authController, userController.isEmailExist);

module.exports = router;
