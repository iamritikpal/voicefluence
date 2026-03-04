const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many signup attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { error: 'Too many resend requests. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', signupLimiter, authController.signup);
router.post('/verify-email', verifyLimiter, authController.verifyEmail);
router.post('/resend-otp', resendLimiter, authController.resendOtp);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/forgot-password', forgotLimiter, authController.forgotPassword);
router.post('/verify-reset-code', verifyLimiter, authController.verifyResetCode);
router.post('/reset-password', verifyLimiter, authController.resetPassword);
router.get('/me', auth, authController.getMe);

module.exports = router;
