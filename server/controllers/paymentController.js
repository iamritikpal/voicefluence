const { Webhook } = require('standardwebhooks');
const User = require('../models/User');
const PaymentEvent = require('../models/PaymentEvent');
const dodoService = require('../services/dodoService');

exports.createCheckout = async (req, res) => {
  try {
    const { type, plan } = req.body;

    if (!type || !plan) {
      return res.status(400).json({ error: 'type and plan are required.' });
    }

    const user = await User.findById(req.userId).select('email name');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { sessionId, checkoutUrl } = await dodoService.createCheckoutSession({
      type,
      plan,
      userId: req.userId,
      customerEmail: user.email,
      customerName: user.name,
    });

    res.json({ sessionId, checkoutUrl });
  } catch (err) {
    console.error('Checkout creation error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to create checkout session.' });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const webhookId = req.headers['webhook-id'];
    const webhookSignature = req.headers['webhook-signature'];
    const webhookTimestamp = req.headers['webhook-timestamp'];

    if (!webhookId || !webhookSignature || !webhookTimestamp) {
      return res.status(400).json({ error: 'Missing webhook headers.' });
    }

    const secret = process.env.DODO_WEBHOOK_SECRET;
    if (!secret) {
      console.error('DODO_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured.' });
    }

    const wh = new Webhook(secret);
    const rawBody = req.body;

    let payload;
    try {
      payload = wh.verify(rawBody, {
        'webhook-id': webhookId,
        'webhook-signature': webhookSignature,
        'webhook-timestamp': webhookTimestamp,
      });
    } catch (verifyErr) {
      console.error('Webhook signature verification failed:', verifyErr.message);
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }

    if (typeof payload === 'string') {
      payload = JSON.parse(payload);
    }

    const existing = await PaymentEvent.findOne({ webhookId });
    if (existing) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    const eventType = payload.type;
    const metadata = payload.data?.metadata || {};
    const userId = metadata.userId;
    const checkoutType = metadata.type;
    const plan = metadata.plan;

    await PaymentEvent.create({
      webhookId,
      eventType,
      userId: userId || '',
      plan: plan || '',
      type: checkoutType || '',
      rawPayload: payload,
    });

    res.status(200).json({ received: true });

    if (eventType === 'payment.succeeded' && userId) {
      processPaymentSuccess(userId, checkoutType, plan).catch((err) =>
        console.error('Async payment processing error:', err)
      );
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  }
};

async function processPaymentSuccess(userId, checkoutType, plan) {
  if (checkoutType === 'subscription') {
    const planConfig = dodoService.getPlan(plan);
    if (!planConfig) {
      console.error(`Unknown plan in webhook: ${plan}`);
      return;
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + planConfig.durationDays);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { credits: planConfig.credits },
        subscriptionPlan: plan,
        subscriptionExpiry: expiry,
      },
      { new: true }
    );

    if (user) {
      console.log(
        `[Payment] User ${userId} upgraded to ${plan}. Credits: ${user.credits}`
      );
    }
  } else if (checkoutType === 'topup') {
    const topupConfig = dodoService.getTopup(plan);
    if (!topupConfig) {
      console.error(`Unknown top-up in webhook: ${plan}`);
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { credits: topupConfig.credits } },
      { new: true }
    );

    if (user) {
      console.log(
        `[Payment] User ${userId} topped up ${topupConfig.credits} credits. Total: ${user.credits}`
      );
    }
  }
}
