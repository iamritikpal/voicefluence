const axios = require('axios');

const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

function getCompletionUrl() {
  return `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;
}

async function chatCompletion(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 2000 } = options;

  const response = await axios.post(
    getCompletionUrl(),
    {
      messages,
      temperature,
      max_tokens: maxTokens,
    },
    {
      headers: {
        'api-key': AZURE_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  return response.data.choices[0].message.content;
}

async function cleanTranscript(rawTranscript) {
  const messages = [
    {
      role: 'system',
      content: `You are a transcript cleaning assistant. Your job is to:
1. Remove filler words (uh, um, like, you know, basically, actually, right, so)
2. Fix grammar and punctuation
3. Improve clarity while keeping the speaker's original tone and intent
4. Extract 3-5 key ideas from the content

Return ONLY valid JSON in this exact format:
{
  "cleanedTranscript": "the cleaned version",
  "keyIdeas": ["idea 1", "idea 2", "idea 3"]
}`,
    },
    {
      role: 'user',
      content: `Clean this transcript and extract key ideas:\n\n"${rawTranscript}"`,
    },
  ];

  const result = await chatCompletion(messages, { temperature: 0.3, maxTokens: 1500 });

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      cleanedTranscript: rawTranscript,
      keyIdeas: [],
    };
  }
}

module.exports = { chatCompletion, cleanTranscript };
