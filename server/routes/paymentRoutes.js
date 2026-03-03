const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createCheckout, handleWebhook } = require('../controllers/paymentController');

router.post('/checkout', auth, createCheckout);
router.post('/webhook', handleWebhook);

module.exports = router;
