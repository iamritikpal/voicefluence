const speech = require('@google-cloud/speech');
const fs = require('fs');

const client = new speech.SpeechClient();

const RECOGNITION_CONFIG = {
  encoding: 'WEBM_OPUS',
  sampleRateHertz: 48000,
  languageCode: 'en-US',
  enableAutomaticPunctuation: true,
  model: 'latest_long',
};

async function transcribeAudio(filePath) {
  const audioBytes = fs.readFileSync(filePath);
  const audioContent = audioBytes.toString('base64');

  const [operation] = await client.longRunningRecognize({
    audio: { content: audioContent },
    config: RECOGNITION_CONFIG,
  });
  const [response] = await operation.promise();

  if (!response.results || response.results.length === 0) {
    throw new Error('No speech detected in the audio. Please try recording again.');
  }

  const transcript = response.results
    .map((result) => result.alternatives[0].transcript)
    .join(' ')
    .trim();

  if (!transcript) {
    throw new Error('Transcription returned empty. Please speak clearly and try again.');
  }

  return transcript;
}

module.exports = { transcribeAudio };
