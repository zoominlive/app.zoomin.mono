const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const customerController = require('../../controllers/customer');
const { withAuthentication } = require('@frontegg/client');

/* Camera end points */
router.get('/all', withAuthentication(), authController, customerController.getAllCustomerDetails);
router.get('/all/locations', withAuthentication(), authController, customerController.getAllCustomerLocations);
router.post('/createCustomer', withAuthentication(), authController, customerController.createCustomer);
router.post('/createCustomerTermsApproval', withAuthentication(), authController, customerController.createCustomerTermsApproval);
router.post('/createCustomerLocation', withAuthentication(), authController, customerController.createCustomerLocations);
router.put('/edit', withAuthentication(), authController, customerController.updateCustomerProfile);
router.get('/getCustomer', withAuthentication(), authController, customerController.getCustomerById);
router.put('/editCustomerLocation', withAuthentication(), authController, customerController.updateCustomerLocation);
router.delete('/delete', authController, withAuthentication(), customerController.deleteCustomer);
router.delete('/deleteCustomerLocation', withAuthentication(), authController, customerController.deleteCustomerLocation);
router.get('/locations', authController, withAuthentication(), customerController.getLocationDetails)

module.exports = router;
