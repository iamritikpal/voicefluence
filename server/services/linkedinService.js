const axios = require('axios');
const { chatCompletion } = require('./azureClient');

async function extractLinkedInMeta(linkedinUrl) {
  try {
    const response = await axios.get(linkedinUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const html = response.data;
    const extract = (pattern) => {
      const match = html.match(pattern);
      return match ? match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() : '';
    };

    return {
      title: extract(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ||
             extract(/<title>([^<]*)<\/title>/),
      description: extract(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ||
                   extract(/<meta[^>]*name="description"[^>]*content="([^"]*)">/),
      image: extract(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"/),
    };
  } catch {
    return { title: '', description: '', image: '' };
  }
}

async function analyzeLinkedInProfile(linkedinUrl, userName) {
  const meta = await extractLinkedInMeta(linkedinUrl);

  const profileContext = [
    meta.title && `Profile headline: ${meta.title}`,
    meta.description && `Profile summary: ${meta.description}`,
    `LinkedIn URL: ${linkedinUrl}`,
    `Name: ${userName}`,
  ]
    .filter(Boolean)
    .join('\n');

  const messages = [
    {
      role: 'system',
      content: `You are a LinkedIn profile analyst. Based on whatever information is available about this LinkedIn user, build a comprehensive professional profile and writing style profile.

Extract or infer:
1. Professional background (role, industry, seniority)
2. Content niche they likely operate in
3. A realistic writing style profile for LinkedIn

If limited data is available, make educated inferences based on the URL slug, name, and any meta information. Be reasonable — don't fabricate specific job titles or companies, but infer the general domain.

Return ONLY valid JSON:
{
  "headline": "Their likely professional headline",
  "about": "A brief professional summary",
  "niche": "Their content niche",
  "writingStyleProfile": {
    "tone": "e.g. analytical, storytelling, bold, conversational",
    "hookStyle": "e.g. question, bold statement, story opener, contrarian take",
    "formattingStyle": "e.g. short paragraphs, one-liners, bullet points",
    "ctaStyle": "e.g. question to audience, soft ask, invitation to share",
    "niche": "their professional domain",
    "authorityMarkers": ["marker1", "marker2"],
    "vocabularyLevel": "e.g. simple and direct, moderately sophisticated"
  }
}`,
    },
    {
      role: 'user',
      content: `Analyze this LinkedIn profile and build a writing style profile:\n\n${profileContext}`,
    },
  ];

  const result = await chatCompletion(messages, { temperature: 0.4, maxTokens: 1200 });

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      headline: meta.title || userName,
      about: meta.description || '',
      niche: 'general professional',
      writingStyleProfile: {
        tone: 'professional conversational',
        hookStyle: 'bold statement',
        formattingStyle: 'short paragraphs',
        ctaStyle: 'question to audience',
        niche: 'general professional',
        authorityMarkers: [],
        vocabularyLevel: 'moderately sophisticated',
      },
    };
  }
}

module.exports = { analyzeLinkedInProfile };
