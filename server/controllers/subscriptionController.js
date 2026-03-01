const User = require('../models/User');

const PLAN_CREDITS = {
  starter: 100,
  pro: 300,
  ultra: 1000,
};

const TOPUP_CREDITS = {
  small: 50,
  medium: 150,
};

exports.upgrade = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLAN_CREDITS[plan]) {
      return res.status(400).json({ error: 'Invalid plan. Choose starter, pro, or ultra.' });
    }

    const creditsToAdd = PLAN_CREDITS[plan];
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $inc: { credits: creditsToAdd },
        subscriptionPlan: plan,
        subscriptionExpiry: expiry,
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({
      message: `Upgraded to ${plan} plan. ${creditsToAdd} credits added.`,
      credits: user.credits,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiry: user.subscriptionExpiry,
    });
  } catch (err) {
    console.error('Upgrade error:', err);
    res.status(500).json({ error: 'Server error during upgrade.' });
  }
};

exports.topup = async (req, res) => {
  try {
    const { package: pkg } = req.body;

    if (!TOPUP_CREDITS[pkg]) {
      return res.status(400).json({ error: 'Invalid package. Choose small or medium.' });
    }

    const creditsToAdd = TOPUP_CREDITS[pkg];

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { credits: creditsToAdd } },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({
      message: `${creditsToAdd} credits added to your account.`,
      credits: user.credits,
    });
  } catch (err) {
    console.error('Top-up error:', err);
    res.status(500).json({ error: 'Server error during top-up.' });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('credits subscriptionPlan subscriptionExpiry');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const now = new Date();
    const isExpired = user.subscriptionExpiry && user.subscriptionExpiry < now;

    res.json({
      credits: user.credits,
      subscriptionPlan: isExpired ? 'free' : user.subscriptionPlan,
      subscriptionExpiry: user.subscriptionExpiry,
      isExpired: !!isExpired,
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};
