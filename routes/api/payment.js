const express = require('express');

const router = express.Router();

/* Required Controllers */
const stripeCustMiddleware = require('../../middleware/set_stripe_cust');
const PaymentController = require('../../controllers/payment');
const auth = require('../../middleware/auth');

/*recordings end points */
router.post('/create-payment-intent', auth, stripeCustMiddleware, PaymentController.createPaymentIntent);
router.post('/save-card-details', auth, stripeCustMiddleware, PaymentController.saveCardDetails);
router.get('/list-customer-payment-method', auth, stripeCustMiddleware, PaymentController.listCustPaymentMethod);
router.get('/list-subscriptions', auth, stripeCustMiddleware, PaymentController.listSubscriptions);
router.get('/list-invoice', auth, stripeCustMiddleware, PaymentController.listInvoice);
router.get('/list-scheduled-subscriptions', auth, stripeCustMiddleware, PaymentController.listScheduledSubscriptions);
router.get('/list-products', auth, stripeCustMiddleware, PaymentController.listProducts);
router.put('/update-customer', auth, stripeCustMiddleware, PaymentController.updateCustomer);
router.post('/detach-payment-method', auth, stripeCustMiddleware, PaymentController.detachPaymentMethod);
router.post('/create-checkout', auth, stripeCustMiddleware, PaymentController.createSubscription);

module.exports = router;