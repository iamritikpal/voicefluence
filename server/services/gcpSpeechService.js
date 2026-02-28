const speech = require('@google-cloud/speech');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

const speechClient = new speech.SpeechClient();
const storage = new Storage();

const GCS_BUCKET = process.env.GCS_BUCKET_NAME || 'voicefluence-audio';

const RECOGNITION_CONFIG = {
  encoding: 'WEBM_OPUS',
  sampleRateHertz: 48000,
  languageCode: 'en-US',
  enableAutomaticPunctuation: true,
  model: 'latest_long',
};

async function ensureBucketExists() {
  const [exists] = await storage.bucket(GCS_BUCKET).exists();
  if (!exists) {
    await storage.createBucket(GCS_BUCKET, { location: 'US' });
  }
}

async function uploadToGCS(filePath) {
  await ensureBucketExists();
  const filename = `audio/${Date.now()}-${path.basename(filePath)}`;
  await storage.bucket(GCS_BUCKET).upload(filePath, { destination: filename });
  return `gs://${GCS_BUCKET}/${filename}`;
}

async function deleteFromGCS(gcsUri) {
  try {
    const filePath = gcsUri.replace(`gs://${GCS_BUCKET}/`, '');
    await storage.bucket(GCS_BUCKET).file(filePath).delete();
  } catch {
    // best-effort cleanup
  }
}

async function transcribeAudio(filePath) {
  const gcsUri = await uploadToGCS(filePath);

  try {
    const [operation] = await speechClient.longRunningRecognize({
      audio: { uri: gcsUri },
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
  } finally {
    await deleteFromGCS(gcsUri);
  }
}

module.exports = { transcribeAudio };
