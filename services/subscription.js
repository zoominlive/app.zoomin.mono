const Sequelize = require("sequelize");
const connectToDatabase = require("../models/index");
const moment = require("moment");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = {
/* create a subscription*/
createSubscription: async (subscriptionObj) => {
  const { Subscriptions } = await connectToDatabase();
  if (subscriptionObj.object === 'subscription') {
    let updatedStartAt = new Date(subscriptionObj.current_period_start * 1000);
    let updatedEndAt = new Date(subscriptionObj.current_period_end * 1000);
    
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
    async function getProductsForSubscriptions(subscription) {
      try {
        const productIds = subscription.plan.product;
        const product = getProductInfo(productIds);
        return product;
      } catch (error) {
        console.error('Error fetching products for subscriptions:', error);
        throw error;
      }
    }

    // Get subscriptions with associated products
    const subscriptionsWithProducts = await getProductsForSubscriptions(subscriptionObj);

    let subscriptionCreated = await Subscriptions.create({
      cust_id: subscriptionObj.customer,
      plan: subscriptionObj.plan.id,
      product_name: subscriptionsWithProducts.name,
      scheduled: 0,
      stripe_id: subscriptionObj.id,
      stripe_status: subscriptionObj.status,
      stripe_price: parseInt((subscriptionObj.plan.amount) / 100),
      quantity: subscriptionObj.quantity,
      starts_at: updatedStartAt,
      ends_at: updatedEndAt,
      trial_starts_at: subscriptionObj.trial_start,
      trial_ends_at: subscriptionObj.trial_end,
    });
  
    return subscriptionCreated;
  } else {

    let updatedScheduleStartAt = new Date(subscriptionObj.phases[0].start_date * 1000);
    let updatedScheduleEndAt = new Date(subscriptionObj.phases[0].end_date * 1000);
    let updatedScheduleTrialEndAt = new Date(subscriptionObj.phases[0].trial_end * 1000);
    const { unit_amount } = await stripe.prices.retrieve(subscriptionObj.phases[0].items[0].price);

    const price_id = subscriptionObj.phases[0].items[0].price;
    const {product} = await stripe.prices.retrieve(price_id);
    console.log('product-->', product);
    const productInfo = await stripe.products.retrieve(product);

    let subscriptionCreated = await Subscriptions.create({
      cust_id: subscriptionObj.customer,
      plan: subscriptionObj.phases[0].items[0].plan,
      product_name: productInfo.name,
      scheduled: 1,
      stripe_id: subscriptionObj.id,
      stripe_status: subscriptionObj.status,
      stripe_price: parseInt(unit_amount / 100),
      quantity: subscriptionObj.phases[0].items[0].quantity,
      starts_at: updatedScheduleStartAt,
      ends_at: updatedScheduleEndAt,
      trial_starts_at: updatedScheduleStartAt,
      trial_ends_at: updatedScheduleTrialEndAt,
    });
  
    return subscriptionCreated;
  }
},

listSubscriptions: async (stripe_cust_id) => {
  const { Subscriptions } = await connectToDatabase();
  let subcriptions = await Subscriptions.findAll({
    order: [["created_at", "DESC"]],
    where: {
      cust_id: stripe_cust_id
    },
    raw: true,
  });
  return subcriptions;
},

createInvoice: async (invoiceObj) => {
  const { Invoice } = await connectToDatabase();
  let invoice_created_at = new Date(invoiceObj.created * 1000);
  // Retrieve the invoice using the Stripe API
  const invoice = await stripe.invoices.retrieve(invoiceObj.id, {
    expand: ["payment_intent"], // Expand the payment intent to get payment method details
  });

  // Extract payment method details from the payment intent
  const paymentMethod = invoice.payment_intent?.payment_method;
  let cardType;
  if(paymentMethod) {
    // Retrieve the payment method details using the payment method ID
    const paymentMethodDetails = await stripe.paymentMethods.retrieve(
      paymentMethod
    );
    // Extract relevant information about the payment method (e.g., card type)
    cardType = paymentMethodDetails.card.funding;
  } else {
    cardType = null;
  }
  
  let invoiceCreated = await Invoice.create({
    invoice_id: invoiceObj.id,
    stripe_cust_id: invoiceObj.customer,
    charge_id: invoiceObj.charge,
    invoice_date: invoice_created_at,
    description: invoiceObj.lines.data[0].description,
    quantity: invoiceObj.lines.data[0].quantity,
    payment_method: cardType,
    amount_paid: parseFloat(invoiceObj.amount_paid / 100).toFixed(2),
    amount_due: parseFloat(invoiceObj.amount_due / 100).toFixed(2),
    subtotal: parseFloat(invoiceObj.subtotal / 100).toFixed(2),
    tax: parseFloat(invoiceObj.tax / 100).toFixed(2),
    total: parseFloat(invoiceObj.total / 100).toFixed(2),
    metadata: invoiceObj,
    status: invoiceObj.status,
    created_at: invoice_created_at,
  });

  return invoiceCreated;
},

listInvoice: async (stripe_cust_id, filter) => {
  let {
    pageNumber = 0,
    pageSize = 10,
    status = "All",
    method = "All",
    startDate,
    endDate,
  } = filter;

  const { Invoice } = await connectToDatabase();
  let invoiceList = await Invoice.findAndCountAll({
    logging: console.log,
    limit: parseInt(pageSize),
    offset: parseInt(pageNumber * pageSize),
    order: [["created_at", "DESC"]],
    where: {
      stripe_cust_id: stripe_cust_id,
      created_at: {
        [Sequelize.Op.between]: [
          moment(startDate).startOf('day').toISOString(),
          moment(endDate).endOf('day').toISOString()
        ]
      },
      ...(status !== 'All' && status ? { status: status } : {}),
      ...(method !== 'All' && method ? { payment_method: method } : {})
  },
    raw: true,
  });
  return { invoiceList: invoiceList.rows, count: invoiceList.count };
},

// Insert a webhook log into the database
insertWebhookLog: async (event, payload) => {
  const { Webhooks } = await connectToDatabase();

  try {
    const webhookLog = await Webhooks.create({
      event: event,
      payload: payload
    });
    return webhookLog.toJSON();
  } catch (error) {
    console.error('Error inserting webhook log:', error);
  }
}

};