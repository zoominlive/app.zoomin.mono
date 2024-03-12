const express = require('express');

const router = express.Router();

/* Required Controllers */
const authController = require('../../middleware/auth');
const PaymentController = require('../../controllers/payment');

/*recordings end points */
router.post('/create-payment-intent', PaymentController.createPaymentIntent);
router.post('/save-card-details', PaymentController.saveCardDetails);
router.get('/list-customer-payment-method', PaymentController.listCustPaymentMethod);
router.post('/detach-payment-method', PaymentController.detachPaymentMethod);

module.exports = router;