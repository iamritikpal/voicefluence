const mongoose = require('mongoose');

const writingStyleProfileSchema = new mongoose.Schema(
  {
    tone: { type: String, default: '' },
    hookStyle: { type: String, default: '' },
    formattingStyle: { type: String, default: '' },
    ctaStyle: { type: String, default: '' },
    niche: { type: String, default: '' },
    authorityMarkers: { type: [String], default: [] },
    vocabularyLevel: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: null },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  googleId: { type: String, default: null },
  gender: { type: String, enum: ['man', 'woman', 'non-binary', ''], default: '' },
  ageRange: { type: String, default: '' },
  industry: { type: String, default: '' },
  contentGoal: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  headline: { type: String, default: '' },
  about: { type: String, default: '' },
  pastPosts: { type: [String], default: [] },
  writingStyleProfile: { type: writingStyleProfileSchema, default: () => ({}) },
  onboardingComplete: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  verificationCodeExpires: { type: Date, default: null },
  resetCode: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null },
  credits: { type: Number, default: 0, min: 0 },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'ultra'],
    default: 'free',
  },
  subscriptionExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
