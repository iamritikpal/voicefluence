const User = require('../models/User');

const GENERATION_COST = 5;

async function creditCheck(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('credits');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.credits < GENERATION_COST) {
      return res.status(403).json({
        error: 'Insufficient credits',
        credits: user.credits,
        required: GENERATION_COST,
      });
    }

    next();
  } catch (err) {
    console.error('Credit check error:', err);
    res.status(500).json({ error: 'Server error during credit check.' });
  }
}

module.exports = creditCheck;
