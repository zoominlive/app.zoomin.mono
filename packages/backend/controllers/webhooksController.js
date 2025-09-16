const subscription = require('../services/subscription');
const connectToDatabase = require("../models/index");

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
    case 'customer.created':
      // Handle subscription created event
      console.log('Customer created:', event.data.object);
      await subscription.insertWebhookLog('customer.created',  event.data.object);
      break;
    case 'customer.updated':
      // Handle subscription created event
      console.log('Customer updated:', event.data.object);
      await subscription.insertWebhookLog('customer.updated',  event.data.object);
      break;
    case 'customer.deleted':
      // Handle subscription created event
      console.log('Customer deleted:', event.data.object);
      await subscription.insertWebhookLog('customer.deleted',  event.data.object);
      break;
    case 'customer.subscription.created':
      // Handle subscription created event
      console.log('Subscription created:', event.data.object);
      await subscription.createSubscription(event.data.object);
      await subscription.insertWebhookLog('customer.subscription.created',  event.data.object);
      break;
    case 'customer.subscription.updated':
      // Handle subscription updated event
      await subscription.updateSubscription(event.data.object);
      await subscription.insertWebhookLog('customer.subscription.created',  event.data.object);
      break;
    case 'customer.subscription.deleted':
      // Handle subscription created event
      console.log('Subscription deleted:', event.data.object);
      await subscription.insertWebhookLog('customer.subscription.deleted',  event.data.object);
      break;
    case 'payment_intent.succeeded':
      // Handle subscription created event
      console.log('Payment intent succeeded:', event.data.object);
      await subscription.insertWebhookLog('payment_intent.succeeded',  event.data.object);
      break;
    case 'payment_intent.created':
      // Handle subscription created event
      console.log('Payment intent created:', event.data.object);
      await subscription.insertWebhookLog('payment_intent.created',  event.data.object);
      break;
    case 'invoice.created':
      // Handle invoice created event
      console.log('Invoice created:', event.data.object);
      await subscription.createInvoice(event.data.object);
      await subscription.insertWebhookLog('invoice.created',  event.data.object);
      break;
    case 'invoice.updated':
      // Handle invoice updated event
      await subscription.updateInvoice(event.data.object);
      await subscription.insertWebhookLog('invoice.created',  event.data.object);
      break;
    case 'invoiceitem.created':
      // Handle subscription created event
      // await subscription.createInvoice(event.data.object);
      await subscription.insertWebhookLog('invoice.created',  event.data.object);
      break;
    case 'invoice.finalized':
      // Handle invoice finalized event
      console.log('Invoice finalized:', event.data.object);
      // await subscription.createInvoice(event.data.object);
      await subscription.insertWebhookLog('invoice.finalized',  event.data.object);
      break;
    case 'invoice.paid':
      // Handle subscription created event
      console.log('Invoice finalized:', event.data.object);
      await subscription.insertWebhookLog('invoice.paid',  event.data.object);
      break;
    case 'invoice.payment_succeeded':
      // Handle subscription created event
      console.log('Invoice payment succeeded:', event.data.object);
      await subscription.insertWebhookLog('invoice.payment_succeeded',  event.data.object);
      break;
    case 'charge.succeeded':
      // Handle subscription created event
      console.log('Charge succeeded:', event.data.object);
      await subscription.insertWebhookLog('charge.succeeded',  event.data.object);
      break;
    case 'subscription_schedule.created':
    // Handle subscription created event
    console.log('Subscription Schedule created:', event.data.object);
    await subscription.createSubscription(event.data.object);
    await subscription.insertWebhookLog('subscription_schedule.created',  event.data.object);
    case 'product.created':
    // Handle product created event
    console.log('Product created:', event.data.object);
    await subscription.insertWebhookLog('product.created',  event.data.object);
    case 'price.created':
    // Handle price created event
    console.log('Price created:', event.data.object);
    await subscription.insertWebhookLog('price.created',  event.data.object);
    case 'plan.created':
    // Handle plan created event
    console.log('Plan created:', event.data.object);
    await subscription.insertWebhookLog('plan.created',  event.data.object);
    case 'product.updated':
    // Handle product updated event
    console.log('Product updated:', event.data.object);
    await subscription.insertWebhookLog('product.updated',  event.data.object);
    break;
    default:
      // Handle other events if needed
      console.log('Unhandled event type:', event.type);
  }

  // Respond with 200 status to acknowledge receipt of the event
  res.sendStatus(200);
};

const recordingsWebhookController = async(req, res) => {
  console.log('Webhook received:', req.body);

  // Process the webhook payload
  const { event, data } = req.body;

  if (!event || !data) {
    return res.status(400).send({ message: 'Invalid webhook payload' });
  }

  // Handle the event
  switch (event) {
    case 'recording.started':
      console.log('Recording started:', data);
      break;
    case 'recording.stopped':
      console.log('Recording stopped:', data);
      const { RecordRtsp } = await connectToDatabase();
      try {
        const updateRecordRtsp = await RecordRtsp.update(
          {
            stop_time: data.end_time,
            duration: data.recording_duration,
            active: false,
          },
          { where: { record_uuid: data.recording_id } }
        );
        console.log("Record updated successfully:", updateRecordRtsp);
      } catch (error) {
        console.error("Error updating record:", error.message);
        throw error; // Re-throw if needed for further error handling
      }
      break;
    default:
      console.log('Unhandled event:', event);
  }

  // Respond to the webhook source
  res.status(200).send({ message: 'Webhook processed successfully' });
}

module.exports = {webhookController, recordingsWebhookController};
