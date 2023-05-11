const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const customerController = require('../../controllers/customer');

/* Camera end points */
router.get('/all', authController, customerController.getAllCustomerDetails);
router.post('/createCustomer', authController, customerController.createCustomer);
router.put('/edit', authController, customerController.updateCustomerProfile);
router.delete('/delete', authController, customerController.deleteCustomer);

module.exports = router;
