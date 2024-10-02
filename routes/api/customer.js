const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const customerController = require('../../controllers/customer');
const { withAuthentication } = require('@frontegg/client');

/* Camera end points */
router.get('/all', withAuthentication(), authController, customerController.getAllCustomerDetails);
router.get('/all/locations', withAuthentication(), authController, customerController.getAllCustomerLocations);
router.post('/create-customer', withAuthentication(), authController, customerController.createCustomer);
router.post('/create-customer-terms-approval', withAuthentication(), authController, customerController.createCustomerTermsApproval);
router.post('/create-customer-location', withAuthentication(), authController, customerController.createCustomerLocations);
router.put('/edit', withAuthentication(), authController, customerController.updateCustomerProfile);
router.get('/get-customer', withAuthentication(), authController, customerController.getCustomerById);
router.put('/edit-customer-location', withAuthentication(), authController, customerController.updateCustomerLocation);
router.put('/locations/enable', withAuthentication(), authController, customerController.updateCustomerLocation);
router.put('/locations/disable', withAuthentication(), authController, customerController.updateCustomerLocation);
router.delete('/delete', withAuthentication(), authController, customerController.deleteCustomer);
router.delete('/delete-customer-location', withAuthentication(), authController, customerController.deleteCustomerLocation);
router.get('/locations', withAuthentication(), authController, customerController.getLocationDetails)

module.exports = router;
