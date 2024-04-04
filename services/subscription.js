const connectToDatabase = require("../models/index");
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
    logging: console.log,
    order: [["created_at", "DESC"]],
    where: {
      cust_id: stripe_cust_id
    },
    raw: true,
  });
  console.log('subcriptions---->', subcriptions);
  return subcriptions;
},

createInvoice: async (invoiceObj) => {
  const { Invoice } = await connectToDatabase();
  let invoice_created_at = new Date(invoiceObj.created * 1000);
  let invoiceCreated = await Invoice.create({
    invoice_id: invoiceObj.id,
    stripe_cust_id: invoiceObj.customer,
    charge_id: invoiceObj.charge,
    invoice_date: invoice_created_at,
    description: invoiceObj.description,
    quantity: invoiceObj.lines.data.map((item) => item.quantity),
    payment_method: invoiceObj.collection_method,
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

listInvoice: async (stripe_cust_id) => {
  const { Invoice } = await connectToDatabase();
  let invoiceList = await Invoice.findAll({
    logging: console.log,
    order: [["created_at", "DESC"]],
    where: {
      stripe_cust_id: stripe_cust_id
    },
    raw: true,
  });
  console.log('invoiceList---->', invoiceList);
  return invoiceList;
},
};