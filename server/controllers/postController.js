const fs = require('fs');
const path = require('path');
const User = require('../models/User');
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

    res.json({
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

    res.json(result);
  } catch (err) {
    console.error('Regenerate post error:', err);
    res.status(500).json({ error: 'Failed to regenerate post.' });
  }
};
