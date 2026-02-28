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
  password: { type: String, required: true },
  linkedinUrl: { type: String, default: '' },
  pastPosts: { type: [String], default: [] },
  writingStyleProfile: { type: writingStyleProfileSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
