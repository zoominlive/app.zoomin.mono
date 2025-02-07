const moment = require("moment");
const subscription = require("../services/subscription");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
    const { cardToken, stripe_cust_id } = req.body;

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
        customer: stripe_cust_id, // Assuming you have a user ID to associate the payment method with
      });
      const customer = await stripe.customers.update(
        stripe_cust_id,
        {
          invoice_settings: {
            default_payment_method: paymentMethod.id
          }
        }
      );

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
      const customer = await stripe.customers.retrieve(stripe_cust_id);
      const defaultCard = paymentMethods.data.filter((item) => item.id === customer.invoice_settings.default_payment_method)
      const backupCard = paymentMethods.data.filter((item) => item.id !== customer.invoice_settings.default_payment_method)
      res.status(200).json({ 
        data: paymentMethods,
        customerDetails: customer,
        defaultCard: defaultCard,
        backupCard: backupCard,
        message: `Customer's Payment Method retrieved successfully` 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Failed to retrieve Customer's Payment Method/Details as customer might not exist. Please create a customer!` });
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
  },

  createSubscription: async(req, res) => {
    const {stripe_cust_id, products, startDate, trial_period_days, trialend} = req.body;
    try {      
      const calculateEndOfMonth = (timestamp) => {
        // Convert the timestamp to a Date object
        const date = new Date(timestamp * 1000);
    
        // Get the year and month from the date
        const year = date.getFullYear();
        const month = date.getMonth();
    
        // Create a new Date object for the first day of the next month
        const nextMonthFirstDay = new Date(year, month + 1, 1);
    
        // Subtract one day from the first day of the next month to get the last day of the current month
        const lastDayOfMonth = new Date(nextMonthFirstDay.getTime() - 1);
    
        // Convert the last day of the month to a Unix timestamp
        const lastDayOfMonthTimestamp = Math.floor(lastDayOfMonth.getTime() / 1000);

        // Convert the first day of the next month to a Unix timestamp
        const nextMonthFirstDayTimestamp = Math.floor(nextMonthFirstDay.getTime() / 1000);
        // Convert the last day of the month to a Unix timestamp and return
        return {
          lastDayOfMonth: lastDayOfMonthTimestamp,
          nextMonthFirstDay: nextMonthFirstDayTimestamp
        };
      };
      const trialEndDate = startDate + (parseInt(trial_period_days) * 24 * 60 * 60)
      const phaseEndDate = calculateEndOfMonth(trialEndDate).lastDayOfMonth;
      const nextPhaseStartDate = calculateEndOfMonth(trialEndDate).nextMonthFirstDay;
      // comment the upper part afterwards
      const subscriptions = await Promise.all(products.map(async (product) => {
        const { price_id, qty } = product;
        let subscriptionSchedule;
        let subscription;
        if (trial_period_days !== 0) {
          const updatedStartDate = new Date(startDate * 1000);
          const trialEnd = new Date(updatedStartDate);
          // trialEnd.setDate(trialEnd.getDate() + parseInt(trial_period_days)); // 14 days trial
          trialEnd.setDate(trialEnd.getDate()); // 14 days trial

          // Ensure trialEnd is before the start of the next month
          const nextMonth = new Date(trialEnd.getFullYear(), trialEnd.getMonth() + 1, 1);

          if (trialEnd.getTime() >= nextMonth.getTime()) {
            // If trialEnd is after the start of the next month, set it to the end of the current month
            nextMonth.setDate(0);
            trialEnd.setDate(nextMonth.getDate());
          }

          subscriptionSchedule = await stripe.subscriptions.create({
            customer: stripe_cust_id,
            items: [{ price: price_id, quantity: qty ? qty : 1 }],
            trial_end: Math.floor(trialEnd.getTime() / 1000),
            billing_cycle_anchor: Math.floor(nextMonth.getTime() / 1000),
            proration_behavior: 'create_prorations',
          });          
          return subscriptionSchedule;
          // subscriptionSchedule = await stripe.subscriptionSchedules.create({
          //   customer: stripe_cust_id,
          //   start_date: startDate,
          //   end_behavior: 'release',
          //   phases: [
          //     {
          //       items: [
          //         {
          //           price: price_id,
          //           quantity: qty,
          //         },
          //       ],
          //       trial_end: trialEndDate, // 10 days from the start date
          //       end_date: phaseEndDate,
          //       proration_behavior: "create_prorations",
          //     },
          //     {
          //       items: [
          //         {
          //           price: price_id,
          //           quantity: qty,
          //         },
          //       ],
          //       metadata: {
          //         start_date: nextPhaseStartDate,
          //         billing_cycle_anchor: nextPhaseStartDate
          //       },
          //       proration_behavior: "create_prorations",
          //     },
          //   ],
          // });        
          // return subscriptionSchedule;
        } else {
          subscription = await stripe.subscriptions.create({
            customer: stripe_cust_id,
            items: [
              {
                price: price_id,
                quantity: qty,
              },
            ],
            proration_behavior: 'create_prorations',
            billing_cycle_anchor_config: {
              day_of_month: 1,
            },
          });
          return subscription;
        }
      }));
      res.status(200).json({ 
        data: subscriptions,
        message: 'Subscription created' 
      });
    } catch (error) {
      console.error('Error fetching product info:', error);
      res.status(500).json({ 
        message: 'Error creating subscription',
        error: error
      });
      throw error;
    }
  },

  listSubscriptions: async(req, res) => {
    const { stripe_cust_id } = req.query;

    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripe_cust_id
      });
      const subscriptionsFromDB = await subscription.listSubscriptions(stripe_cust_id);
      
      // Function to get product information for subscriptions
      async function getProductInfo(productId) {
        try {
          const product = await stripe.products.retrieve(productId);
          return product;
        } catch (error) {
          console.error('Error fetching product info:', error);
          throw error;
        }
      }

      // Function to get products for subscriptions
      async function getProductsForSubscriptions(subscriptions) {
        try {
          const productIds = subscriptions.map((subscription) => subscription.plan.product);
          const productPromises = productIds.map((productId) => getProductInfo(productId));
          const products = await Promise.all(productPromises);
          const subscriptionsWithProducts = subscriptions.map((subscription, index) => ({
            ...subscription,
            product: products[index],
          }));
          return subscriptionsWithProducts;
        } catch (error) {
          console.error('Error fetching products for subscriptions:', error);
          throw error;
        }
      }

      // Get subscriptions with associated products
      const subscriptionsWithProducts = await getProductsForSubscriptions(subscriptions.data);


      res.status(200).json({ 
        data: {
          subscriptions: subscriptionsWithProducts,
          subscriptionsFromDB: subscriptionsFromDB
        },
        message: 'Subscriptions retrieved' 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Failed to retrieve Subscriptions` });
    }
  },

  listInvoice: async(req, res) => {
    const { stripe_cust_id } = req.query;

    const filter = {
      startDate: req.query?.from ? req.query?.from : moment(),
      endDate: req.query?.to ? req.query?.to : moment(),
      pageNumber: req.query?.pageNumber,
      pageSize: req.query?.pageSize,
      status: req.query?.status,
      method: req.query?.method,
      pageCount: req.query?.pageCount,
      orderBy: req.query?.orderBy,
      cust_id: req.query?.cust_id
    };

    try {
      const invoices = await stripe.invoices.list({
        customer: stripe_cust_id,
      });

      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: stripe_cust_id,
      });

      const invoiceFromDB = await subscription.listInvoice(
        stripe_cust_id,
        filter
      );
      res.status(200).json({
        data: invoices,
        invoiceFromDB: invoiceFromDB.invoiceList,
        upcomingInvoice: upcomingInvoice,
        message: "Invoice retrieved",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Failed to retrieve Invoice or No upcoming invoices` });
    }    
  },

  listScheduledSubscriptions: async(req, res) => {
    const { stripe_cust_id } = req.query;
    console.log('stripe_cust_id---', stripe_cust_id);
    try {
      const subscriptions = await stripe.subscriptionSchedules.list({
        customer: stripe_cust_id,
        limit:50
      });
      /* Filter out the subcriptions those aren't cancelled */
      const filteredData = subscriptions.data.filter((item) => item.canceled_at == null);
      const subscriptionsFromDB = await subscription.listSubscriptions(stripe_cust_id);
      res.status(200).json({ 
        data: {
          subscriptions: filteredData,
          localSubscriptions: subscriptionsFromDB
        },
        message: 'Subscriptions retrieved' 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Failed to retrieve Subscriptions` });
    }
  },

  listProducts: async(req, res) => {
    try {
      const productList = await stripe.products.list({
        limit: 20
      });
      const priceList = await stripe.prices.list({
        limit: 30
      });
      res.status(200).json({ 
        data: {
          products: productList,
          priceList: priceList,
          productList: productList.data.map((item) => item.default_price)
        },
        message: 'Products retrieved' 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Failed to retrieve Products` });
    }
  },

  updateCustomer: async(req, res) => {
    const { stripe_cust_id, paymentMethodID, name, email, phone, description, addressline1, addressline2, postalcode, city, state, country  } = req.body;

    try {
      const customer = await stripe.customers.update(
        stripe_cust_id,
        {
          name: name,
          email: email,
          phone: phone,
          description: description,
          invoice_settings: {
            default_payment_method: paymentMethodID
          },
          address: {
            line1: addressline1,
            line2: addressline2,
            country: country,
            state: state,
            city: city,
            postal_code: postalcode,
          }
        }
      );
      res.status(200).json({ 
        data: customer,
        message: 'Payment Method Updated' 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: `Failed to retrieve Products` });
    }
  },
};