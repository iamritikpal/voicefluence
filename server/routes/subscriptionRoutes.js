const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upgrade, topup, getStatus } = require('../controllers/subscriptionController');

router.get('/status', auth, getStatus);
router.post('/upgrade', auth, upgrade);
router.post('/topup', auth, topup);

module.exports = router;
