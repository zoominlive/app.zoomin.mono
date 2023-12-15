const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const customerController = require('../../controllers/customer');

/* Camera end points */
router.get('/all', authController, customerController.getAllCustomerDetails);
router.get('/all/locations', authController, customerController.getAllCustomerLocations);
router.post('/createCustomer', authController, customerController.createCustomer);
router.post('/createCustomerLocation', authController, customerController.createCustomerLocations);
router.put('/edit', authController, customerController.updateCustomerProfile);
router.put('/editCustomerLocation', authController, customerController.updateCustomerLocation);
router.delete('/delete', authController, customerController.deleteCustomer);
router.delete('/deleteCustomerLocation', authController, customerController.deleteCustomerLocation);
router.get('/locations', authController, customerController.getLocationDetails)

module.exports = router;
