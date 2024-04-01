const subscription = require('../services/subscription');

// general structure
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Define your webhook endpoint handler
const webhookController = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    event = req.body;
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return res.sendStatus(400);
  }

  // Handle specific event types
  switch (event.type) {
    case 'customer.subscription.created':
      // Handle subscription created event
      console.log('Subscription created:', event.data.object);
      let addSubscription = await subscription.createSubscription(event.data.object);
      break;
    case 'customer.subscription.deleted':
      // Handle subscription created event
      console.log('Subscription deleted:', event.data.object);
      break;
    case 'payment_intent.succeeded':
      // Handle subscription created event
      console.log('Payment intent succeeded:', event.data.object);
      break;
    case 'payment_intent.created':
      // Handle subscription created event
      console.log('Payment intent created:', event.data.object);
      break;
    case 'invoice.created':
      // Handle subscription created event
      console.log('Invoice created:', event.data.object);
      break;
    case 'invoice.finalized':
      // Handle subscription created event
      console.log('Invoice finalized:', event.data.object);
      break;
    case 'invoice.paid':
      // Handle subscription created event
      console.log('Invoice finalized:', event.data.object);
      break;
    case 'invoice.payment_succeeded':
      // Handle subscription created event
      console.log('Invoice payment succeeded:', event.data.object);
      break;
    case 'charge.succeeded':
      // Handle subscription created event
      console.log('Charge succeeded:', event.data.object);
      break;
    case 'subscription_schedule.created':
    // Handle subscription created event
    console.log('Subscription Schedule created:', event.data.object);
    let addScheduledSubscription = await subscription.createSubscription(event.data.object);
    case 'product.created':
    // Handle product created event
    console.log('Product created:', event.data.object);
    case 'price.created':
    // Handle price created event
    console.log('Price created:', event.data.object);
    case 'plan.created':
    // Handle plan created event
    console.log('Plan created:', event.data.object);
    case 'product.updated':
    // Handle product updated event
    console.log('Product updated:', event.data.object);
    break;
    default:
      // Handle other events if needed
      console.log('Unhandled event type:', event.type);
  }

  // Respond with 200 status to acknowledge receipt of the event
  res.sendStatus(200);
};

module.exports = webhookController;
