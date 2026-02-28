const User = require('../models/User');
const styleAnalyzerService = require('../services/styleAnalyzerService');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ profile: user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { linkedinUrl, pastPosts } = req.body;
    const update = {};

    if (linkedinUrl !== undefined) update.linkedinUrl = linkedinUrl;
    if (pastPosts !== undefined) update.pastPosts = pastPosts;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ profile: user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.analyzeStyle = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { pastPosts } = req.body;
    const postsToAnalyze = pastPosts && pastPosts.length > 0 ? pastPosts : user.pastPosts;

    if (!postsToAnalyze || postsToAnalyze.length === 0) {
      return res.status(400).json({
        error: 'Please provide past LinkedIn posts to analyze your writing style.',
      });
    }

    const styleProfile = await styleAnalyzerService.analyzeWritingStyle(postsToAnalyze);

    user.writingStyleProfile = styleProfile;
    if (pastPosts && pastPosts.length > 0) {
      user.pastPosts = pastPosts;
    }
    await user.save();

    res.json({ writingStyleProfile: styleProfile });
  } catch (err) {
    console.error('Analyze style error:', err);
    res.status(500).json({ error: 'Failed to analyze writing style.' });
  }
};
