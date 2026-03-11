const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: '' },
  pinned: { type: Boolean, default: false },
  hookOptions: { type: [String], default: [] },
  finalPost: { type: String, required: true },
  alternativeVersion: { type: String, default: '' },
  suggestedCTA: { type: String, default: '' },
  hashtags: { type: [String], default: [] },
  cleanedTranscript: { type: String, default: '' },
  keyIdeas: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

postSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
