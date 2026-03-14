const { chatCompletion } = require('./gcpClient');

async function analyzeWritingStyle(pastPosts) {
  const postsText = pastPosts
    .map((post, i) => `--- Post ${i + 1} ---\n${post}`)
    .join('\n\n');

  const messages = [
    {
      role: 'system',
      content: `You are a LinkedIn writing style analyst. Analyze the provided LinkedIn posts and extract a detailed writing style profile.

Evaluate these dimensions:
- tone: The dominant tone (e.g., analytical, storytelling, bold, minimal, conversational, authoritative, vulnerable, inspirational)
- hookStyle: How they open posts (e.g., question, bold statement, story opener, contrarian take, statistic, personal anecdote)
- formattingStyle: How they structure posts (e.g., short paragraphs, one-liners, bullet points, numbered lists, long-form narrative)
- ctaStyle: How they end posts (e.g., question to audience, soft ask, strong CTA, open reflection, invitation to share)
- niche: Their content domain/industry
- authorityMarkers: Specific credentials, experiences, or positioning signals they use (array of strings)
- vocabularyLevel: Their language complexity (e.g., simple and direct, moderately sophisticated, highly technical, mix of casual and professional)

Return ONLY valid JSON in this exact format:
{
  "tone": "",
  "hookStyle": "",
  "formattingStyle": "",
  "ctaStyle": "",
  "niche": "",
  "authorityMarkers": [],
  "vocabularyLevel": ""
}`,
    },
    {
      role: 'user',
      content: `Analyze the writing style from these LinkedIn posts:\n\n${postsText}`,
    },
  ];

  const result = await chatCompletion(messages, { temperature: 0.3, maxTokens: 1000 });

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      tone: 'professional neutral',
      hookStyle: 'question',
      formattingStyle: 'short paragraphs',
      ctaStyle: 'question to audience',
      niche: 'general professional',
      authorityMarkers: [],
      vocabularyLevel: 'moderately sophisticated',
    };
  }
}

module.exports = { analyzeWritingStyle };
