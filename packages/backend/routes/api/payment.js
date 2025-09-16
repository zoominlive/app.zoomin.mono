const express = require('express');

const router = express.Router();

/* Required Controllers */
const stripeCustMiddleware = require('../../middleware/set_stripe_cust');
const PaymentController = require('../../controllers/payment');
const auth = require('../../middleware/auth');
const { withAuthentication } = require('@frontegg/client');

/*recordings end points */
router.post('/create-payment-intent', withAuthentication(), auth, stripeCustMiddleware, PaymentController.createPaymentIntent);
router.post('/save-card-details', withAuthentication(), auth, stripeCustMiddleware, PaymentController.saveCardDetails);
router.get('/list-customer-payment-method', withAuthentication(), auth, stripeCustMiddleware, PaymentController.listCustPaymentMethod);
router.get('/list-subscriptions', withAuthentication(), auth, stripeCustMiddleware, PaymentController.listSubscriptions);
router.get('/list-invoice', withAuthentication(), auth, stripeCustMiddleware, PaymentController.listInvoice);
router.get('/list-scheduled-subscriptions', withAuthentication(), auth, stripeCustMiddleware, PaymentController.listScheduledSubscriptions);
router.get('/list-products', withAuthentication(), auth, stripeCustMiddleware, PaymentController.listProducts);
router.put('/update-customer', withAuthentication(), auth, stripeCustMiddleware, PaymentController.updateCustomer);
router.post('/detach-payment-method', withAuthentication(), auth, stripeCustMiddleware, PaymentController.detachPaymentMethod);
router.post('/create-checkout', withAuthentication(), auth, stripeCustMiddleware, PaymentController.createSubscription);

module.exports = router;