const axios = require('axios');

const DODO_API_KEY = process.env.DODO_API_KEY;
const DODO_BASE_URL = process.env.DODO_BASE_URL || 'https://test.dodopayments.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const SUBSCRIPTION_PLANS = {
  starter: {
    productId: process.env.DODO_STARTER_PRODUCT_ID,
    credits: 100,
    durationDays: 30,
  },
  pro: {
    productId: process.env.DODO_PRO_PRODUCT_ID,
    credits: 300,
    durationDays: 30,
  },
  ultra: {
    productId: process.env.DODO_ULTRA_PRODUCT_ID,
    credits: 1000,
    durationDays: 30,
  },
};

const TOPUP_PACKAGES = {
  small: {
    productId: process.env.DODO_TOPUP_SMALL_PRODUCT_ID,
    credits: 50,
  },
  medium: {
    productId: process.env.DODO_TOPUP_MEDIUM_PRODUCT_ID,
    credits: 150,
  },
};

function getPlan(planId) {
  return SUBSCRIPTION_PLANS[planId] || null;
}

function getTopup(packageId) {
  return TOPUP_PACKAGES[packageId] || null;
}

async function createCheckoutSession({ type, plan, userId, customerEmail, customerName }) {
  let productId;
  let planKey = plan;

  if (type === 'subscription') {
    const planConfig = getPlan(plan);
    if (!planConfig) throw new Error('Invalid subscription plan.');
    if (!planConfig.productId) throw new Error(`Product ID not configured for plan: ${plan}`);
    productId = planConfig.productId;
  } else if (type === 'topup') {
    const topupConfig = getTopup(plan);
    if (!topupConfig) throw new Error('Invalid top-up package.');
    if (!topupConfig.productId) throw new Error(`Product ID not configured for top-up: ${plan}`);
    productId = topupConfig.productId;
  } else {
    throw new Error('Invalid checkout type. Use "subscription" or "topup".');
  }

  const body = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    return_url: `${CLIENT_URL}/dashboard?payment=success`,
    metadata: {
      userId,
      type,
      plan: planKey,
    },
    customer: {
      email: customerEmail,
      name: customerName || undefined,
    },
  };

  const res = await axios.post(`${DODO_BASE_URL}/checkouts`, body, {
    headers: {
      Authorization: `Bearer ${DODO_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return {
    sessionId: res.data.session_id,
    checkoutUrl: res.data.checkout_url,
  };
}

module.exports = {
  createCheckoutSession,
  getPlan,
  getTopup,
  SUBSCRIPTION_PLANS,
  TOPUP_PACKAGES,
};
