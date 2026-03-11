const User = require('../models/User');
const styleAnalyzerService = require('../services/styleAnalyzerService');
const { analyzeLinkedInProfile } = require('../services/linkedinService');

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
    const { name, linkedinUrl, pastPosts, gender, ageRange, industry, contentGoal } = req.body;
    const update = {};

    if (name !== undefined) update.name = name.trim();
    if (linkedinUrl !== undefined) update.linkedinUrl = linkedinUrl;
    if (pastPosts !== undefined) update.pastPosts = pastPosts;
    if (gender !== undefined) update.gender = gender;
    if (ageRange !== undefined) update.ageRange = ageRange;
    if (industry !== undefined) update.industry = industry;
    if (contentGoal !== undefined) update.contentGoal = contentGoal;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ profile: user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.fetchProfile = async (req, res) => {
  try {
    const { linkedinUrl } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const urlToUse = linkedinUrl && linkedinUrl.trim() ? linkedinUrl.trim() : user.linkedinUrl;
    if (!urlToUse) {
      return res.status(400).json({ error: 'LinkedIn URL is required. Save your profile with a URL first.' });
    }

    const profileData = await analyzeLinkedInProfile(urlToUse, user.name);

    user.linkedinUrl = urlToUse;
    user.headline = profileData.headline || '';
    user.about = profileData.about || '';
    user.writingStyleProfile = profileData.writingStyleProfile || user.writingStyleProfile;
    await user.save();

    const updated = await User.findById(req.userId).select('-password');
    res.json({ profile: updated });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: 'Failed to fetch and analyze LinkedIn profile. Please try again.' });
  }
};

exports.onboard = async (req, res) => {
  try {
    const { linkedinUrl, gender, ageRange, industry, contentGoal } = req.body;
    if (!linkedinUrl) {
      return res.status(400).json({ error: 'LinkedIn URL is required.' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const profileData = await analyzeLinkedInProfile(linkedinUrl, user.name);

    user.linkedinUrl = linkedinUrl;
    user.headline = profileData.headline || '';
    user.about = profileData.about || '';
    user.writingStyleProfile = profileData.writingStyleProfile;
    if (gender) user.gender = gender;
    if (ageRange) user.ageRange = ageRange;
    if (industry) user.industry = industry;
    if (contentGoal) user.contentGoal = contentGoal;
    user.onboardingComplete = true;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ profile: userObj });
  } catch (err) {
    console.error('Onboard error:', err);
    res.status(500).json({ error: 'Failed to analyze LinkedIn profile. Please try again.' });
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
