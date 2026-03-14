const path = require("path");
const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");

const MODEL_ID = "gemini-2.5-flash";
const PROJECT_ID = process.env.GCP_PROJECT_ID || "gen-lang-client-0659267804";
const REGION = "global";

const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : path.resolve(__dirname, "../keys/service-account.json");

const auth = new GoogleAuth({
  keyFilename: keyFilePath,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

let cachedClient = null;

async function getAccessToken() {
  if (!cachedClient) {
    cachedClient = await auth.getClient();
  }

  const { token } = await cachedClient.getAccessToken();
  return token;
}


function getEndpointUrl() {
  return `https://aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${MODEL_ID}:generateContent`;
}





function convertMessages(messages) {
  let systemInstruction = null;
  const contents = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = msg.content;
      continue;
    }

    const role = msg.role === "assistant" ? "model" : "user";

    contents.push({
      role,
      parts: [{ text: msg.content }],
    });
  }

  return { systemInstruction, contents };
}

async function chatCompletion(messages, options = {}) {
  const { maxTokens = 1500, temperature = 0.7 } = options;

  const token = await getAccessToken();
  const url = getEndpointUrl();

  const { systemInstruction, contents } = convertMessages(messages);

  const generationConfig = {
    maxOutputTokens: maxTokens,
    temperature,
  };

  const body = {
    contents,
    generationConfig,
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 120000,
  });

  const data = response.data;
  const candidate = data.candidates && data.candidates[0];

  if (!candidate || !candidate.content || !candidate.content.parts) {
    throw new Error("No content returned from Gemini");
  }

  const textPart = candidate.content.parts.find((p) => p.text != null);

  if (!textPart) {
    throw new Error("No text part found in Gemini response");
  }

  return textPart.text;
}

async function cleanTranscript(rawTranscript) {
  const messages = [
    {
      role: "system",
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
      role: "user",
      content: `Clean this transcript and extract key ideas:

"${rawTranscript}"`,
    },
  ];

  const result = await chatCompletion(messages, { maxTokens: 1000 });

  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    return {
      cleanedTranscript: rawTranscript,
      keyIdeas: [],
    };
  }
}

module.exports = {
  chatCompletion,
  cleanTranscript,
};