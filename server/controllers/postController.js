const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const gcpSpeechService = require('../services/gcpSpeechService');
const { cleanTranscript } = require('../services/azureClient');
const postGeneratorService = require('../services/postGeneratorService');

exports.generatePost = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
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
    });

    fs.unlink(audioPath, () => {});

    const post = await Post.create({
      userId: req.userId,
      hookOptions: result.hookOptions || [],
      finalPost: result.finalPost || '',
      alternativeVersion: result.alternativeVersion || '',
      suggestedCTA: result.suggestedCTA || '',
      cleanedTranscript,
      keyIdeas: keyIdeas || [],
    });

    res.json({
      postId: post._id,
      rawTranscript,
      cleanedTranscript,
      keyIdeas,
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
    });

    const postId = req.body.postId;
    if (postId) {
      await Post.findByIdAndUpdate(postId, {
        hookOptions: result.hookOptions || [],
        finalPost: result.finalPost || '',
        alternativeVersion: result.alternativeVersion || '',
        suggestedCTA: result.suggestedCTA || '',
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Regenerate post error:', err);
    res.status(500).json({ error: 'Failed to regenerate post.' });
  }
};

exports.listPosts = async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('finalPost createdAt')
      .lean();
    const list = posts.map((p) => ({
      id: p._id,
      title: (p.finalPost || '').split('\n')[0].slice(0, 60) || 'Untitled post',
      createdAt: p.createdAt,
    }));
    res.json({ posts: list });
  } catch (err) {
    console.error('List posts error:', err);
    res.status(500).json({ error: 'Failed to load posts.' });
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
