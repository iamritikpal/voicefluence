const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { synthesizeSpeech } = require('../services/gcpTtsService');

router.post('/speak', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required.' });
    }

    const audioBuffer = await synthesizeSpeech(text.trim());

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'Failed to synthesize speech.' });
  }
});

module.exports = router;
