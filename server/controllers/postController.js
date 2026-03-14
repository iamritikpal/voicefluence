const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const gcpSpeechService = require('../services/gcpSpeechService');
const { cleanTranscript } = require('../services/gcpClient');
const postGeneratorService = require('../services/postGeneratorService');

const GENERATION_COST = 5;

exports.generatePost = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    // Atomic credit deduction — prevents race conditions
    const user = await User.findOneAndUpdate(
      { _id: req.userId, credits: { $gte: GENERATION_COST } },
      { $inc: { credits: -GENERATION_COST } },
      { new: true }
    );

    if (!user) {
      if (req.file && req.file.path) require('fs').unlink(req.file.path, () => {});
      return res.status(403).json({
        error: 'Insufficient credits',
        credits: 0,
        required: GENERATION_COST,
      });
    }

    const audioPath = req.file.path;

    const rawTranscript = await gcpSpeechService.transcribeAudio(audioPath);

    const { cleanedTranscript, keyIdeas } = await cleanTranscript(rawTranscript);

    const styleProfile = user.writingStyleProfile && user.writingStyleProfile.tone
      ? user.writingStyleProfile
      : null;

    const result = await postGeneratorService.generateLinkedInPost({
      cleanedTranscript,
      keyIdeas,
      writingStyleProfile: styleProfile,
      userName: user.name,
      linkedinUrl: user.linkedinUrl,
      authorProfile: {
        gender: user.gender,
        ageRange: user.ageRange,
        industry: user.industry,
        contentGoal: user.contentGoal,
      },
    });

    fs.unlink(audioPath, () => {});

    const post = await Post.create({
      userId: req.userId,
      hookOptions: result.hookOptions || [],
      finalPost: result.finalPost || '',
      alternativeVersion: result.alternativeVersion || '',
      suggestedCTA: result.suggestedCTA || '',
      hashtags: result.hashtags || [],
      cleanedTranscript,
      keyIdeas: keyIdeas || [],
    });

    res.json({
      postId: post._id,
      rawTranscript,
      cleanedTranscript,
      keyIdeas,
      creditsRemaining: user.credits,
      ...result,
    });
  } catch (err) {
    console.error('Generate post error:', err);
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500).json({ error: err.message || 'Failed to generate post.' });
  }
};

exports.regeneratePost = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { cleanedTranscript, keyIdeas, selectedHook } = req.body;

    if (!cleanedTranscript) {
      return res.status(400).json({ error: 'Transcript data is required for regeneration.' });
    }

    const styleProfile = user.writingStyleProfile && user.writingStyleProfile.tone
      ? user.writingStyleProfile
      : null;

    const result = await postGeneratorService.generateLinkedInPost({
      cleanedTranscript,
      keyIdeas: keyIdeas || [],
      writingStyleProfile: styleProfile,
      userName: user.name,
      linkedinUrl: user.linkedinUrl,
      selectedHook,
      authorProfile: {
        gender: user.gender,
        ageRange: user.ageRange,
        industry: user.industry,
        contentGoal: user.contentGoal,
      },
    });

    const postId = req.body.postId;
    if (postId) {
      await Post.findByIdAndUpdate(postId, {
        hookOptions: result.hookOptions || [],
        finalPost: result.finalPost || '',
        alternativeVersion: result.alternativeVersion || '',
        suggestedCTA: result.suggestedCTA || '',
        hashtags: result.hashtags || [],
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Regenerate post error:', err);
    res.status(500).json({ error: 'Failed to regenerate post.' });
  }
};

function getPostTitle(p) {
  if (p.title && p.title.trim()) return p.title.trim().slice(0, 80);
  return (p.finalPost || '').split('\n')[0].slice(0, 60) || 'Untitled post';
}

exports.listPosts = async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.userId })
      .sort({ pinned: -1, createdAt: -1 })
      .select('finalPost title pinned createdAt')
      .lean();
    const list = posts.map((p) => ({
      id: p._id,
      title: getPostTitle(p),
      pinned: !!p.pinned,
      createdAt: p.createdAt,
    }));
    res.json({ posts: list });
  } catch (err) {
    console.error('List posts error:', err);
    res.status(500).json({ error: 'Failed to load posts.' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { title, pinned } = req.body;
    const update = {};

    if (typeof title === 'string') update.title = title.trim().slice(0, 150);
    if (typeof pinned === 'boolean') update.pinned = pinned;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    ).lean();

    if (!post) return res.status(404).json({ error: 'Post not found.' });

    res.json({
      post: {
        id: post._id,
        title: getPostTitle(post),
        pinned: !!post.pinned,
        createdAt: post.createdAt,
      },
    });
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ error: 'Failed to update post.' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json({
      post: {
        id: post._id,
        hookOptions: post.hookOptions,
        finalPost: post.finalPost,
        alternativeVersion: post.alternativeVersion,
        suggestedCTA: post.suggestedCTA,
        hashtags: post.hashtags || [],
        cleanedTranscript: post.cleanedTranscript,
        keyIdeas: post.keyIdeas || [],
        createdAt: post.createdAt,
      },
    });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Failed to load post.' });
  }
};
