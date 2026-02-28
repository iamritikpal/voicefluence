const textToSpeech = require('@google-cloud/text-to-speech');

const client = new textToSpeech.TextToSpeechClient();

async function synthesizeSpeech(text) {
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Studio-O',
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.05,
      pitch: 1.0,
    },
  });

  return response.audioContent;
}

module.exports = { synthesizeSpeech };
