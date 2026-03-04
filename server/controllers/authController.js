const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 5;

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email });

    if (existing && existing.isVerified) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    if (existing && !existing.isVerified) {
      existing.name = name;
      existing.password = hashedPassword;
      existing.verificationCode = hashedOtp;
      existing.verificationCodeExpires = expires;
      await existing.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        credits: 0,
        verificationCode: hashedOtp,
        verificationCodeExpires: expires,
      });
    }

    await sendVerificationEmail(email, otp);

    res.status(201).json({
      message: 'Verification code sent to your email.',
      email,
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup.' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    if (new Date() > user.verificationCodeExpires) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    const valid = await bcrypt.compare(otp, user.verificationCode);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    user.isVerified = true;
    user.credits = 20;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = generateToken(user._id);
    res.json({
      message: 'Email verified successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
        credits: user.credits,
        subscriptionPlan: user.subscriptionPlan,
      },
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Server error during verification.' });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified.' });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);

    user.verificationCode = hashedOtp;
    user.verificationCodeExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    await sendVerificationEmail(email, otp);

    res.json({ message: 'New verification code sent.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({ error: 'This account uses Google sign-in. Please use "Continue with Google".' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email first.',
        needsVerification: true,
        email: user.email,
      });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
        credits: user.credits,
        subscriptionPlan: user.subscriptionPlan,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, SALT_ROUNDS);

    user.resetCode = hashedOtp;
    user.resetCodeExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(email, otp);

    res.json({ message: 'If an account exists with that email, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and reset code are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or reset code.' });
    }

    if (!user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ error: 'No reset code found. Please request a new one.' });
    }

    if (new Date() > user.resetCodeExpires) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    const valid = await bcrypt.compare(otp, user.resetCode);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid reset code.' });
    }

    res.json({ message: 'Code verified. You can now set a new password.' });
  } catch (err) {
    console.error('Verify reset code error:', err);
    res.status(500).json({ error: 'Server error during verification.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid request.' });
    }

    if (!user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ error: 'No reset code found. Please request a new one.' });
    }

    if (new Date() > user.resetCodeExpires) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    const valid = await bcrypt.compare(otp, user.resetCode);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid reset code.' });
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error during password reset.' });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ error: 'Google email is not verified.' });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (user.authProvider === 'local' && !user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        if (!user.isVerified) {
          user.isVerified = true;
          user.credits = 20;
          user.verificationCode = null;
          user.verificationCodeExpires = null;
        }
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        authProvider: 'google',
        googleId,
        isVerified: true,
        credits: 20,
      });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboardingComplete: user.onboardingComplete,
        credits: user.credits,
        subscriptionPlan: user.subscriptionPlan,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Google authentication failed.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -verificationCode -verificationCodeExpires -resetCode -resetCodeExpires -googleId');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};
