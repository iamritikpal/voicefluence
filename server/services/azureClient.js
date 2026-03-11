const axios = require('axios');

const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const RESPONSES_URL =process.env.AZURE_OPENAI_RESPONSES_URL;

function extractText(data) {
  if (data.output && Array.isArray(data.output)) {
    for (let i = data.output.length - 1; i >= 0; i--) {
      const item = data.output[i];
      if (item.content && Array.isArray(item.content)) {
        const textPart = item.content.find((c) => c && c.text != null);
        if (textPart) return textPart.text;
        if (typeof item.content[0] === 'string') return item.content[0];
        if (item.content[0] && item.content[0].text) return item.content[0].text;
      }
      if (typeof item.content === 'string') return item.content;
      if (item.text != null) return item.text;
    }
  }
  if (data.output_text != null) return data.output_text;
  throw new Error('Could not extract text from Azure Responses API output');
}

async function chatCompletion(messages, options = {}) {
  const { maxTokens = 2000 } = options;

  const body = {
    model: DEPLOYMENT,
    input: messages,
  };
  if (maxTokens != null) body.max_output_tokens = maxTokens;

  const response = await axios.post(RESPONSES_URL, body, {
    headers: {
      'api-key': AZURE_API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
  });

  return extractText(response.data);
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

  const result = await chatCompletion(messages, { maxTokens: 1500 });

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
