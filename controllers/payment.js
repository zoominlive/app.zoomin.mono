const stripe = require("stripe")('sk_test_51OGEnKERJiP7ChzSjk4dnfFCdgzLgDWpJHSeKjuF9hI8dmYFfZVZa00WxKuJKUetc9NTM2C5LxxS12MPZo6RBy7C00kTEy4pzF');

module.exports = {
  createPaymentIntent: async(req, res) => {
    const { items } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: '10',
      currency: "cad",
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
      // payment_method_types: [
      //   'card'
      // ],
    });
  
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  },

  saveCardDetails: async(req, res) => {
    const { cardToken, userId } = req.body;

    try {
      
      // const customer = await stripe.customers.retrieve('cus_NffrFeUfNV2Hib');
      // let newCustomer = {
      //   name: 'Test User',
      //   email: 'test@test.com',
      // };
      // // if(!customer){
      //   newCustomer = await stripe.customers.create(newCustomer);      
      // // }
      // console.log('newCustomer==>', newCustomer);
      const paymentMethod = await stripe.paymentMethods.attach(cardToken, {
        customer: userId, // Assuming you have a user ID to associate the payment method with
      });
  
      // Save payment method details in your database
      const savedCardDetails = {
        cardBrand: paymentMethod.card.brand,
        last4Digits: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
        // Other relevant details
      };
  
      // Code to save savedCardDetails in your database
  
      res.status(200).json({ message: 'Card details saved successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to save card details' });
    }
  },

  listCustPaymentMethod: async(req, res) => {
    const { stripe_cust_id } = req.query;
    console.log('stripe_cust_id==>', stripe_cust_id);
    try {
      const paymentMethods = await stripe.customers.listPaymentMethods(
        stripe_cust_id,
        {
          limit: 3,
        }
      );
      res.status(200).json({ 
        data: paymentMethods,
        message: `Customer's Payment Method retrieved successfully` 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Failed to retrieve Customer's Payment Method` });
    }
  },

  detachPaymentMethod: async(req, res) => {
    console.log('reqBody', req.body);
    const { pm_id } = req.body;
    try {
      const paymentMethodDetached = await stripe.paymentMethods.detach(pm_id);
      res.status(200).json({ 
        data: paymentMethodDetached,
        message: `Customer's Payment Method detached successfully` 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Failed to retrieve Customer's Payment Method` });
    }
  }
};