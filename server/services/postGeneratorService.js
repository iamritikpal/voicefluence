const { chatCompletion } = require('./gcpClient');

function cleanAiSlop(text) {
  if (!text) return text;
  return text
    .replace(/\u2014/g, ' - ')   // em-dash → spaced hyphen
    .replace(/\u2013/g, ' - ')   // en-dash → spaced hyphen
    .replace(/--+/g, ' - ')      // double/triple dashes → spaced hyphen
    .replace(/\u2018|\u2019/g, "'")  // smart single quotes
    .replace(/\u201C|\u201D/g, '"')  // smart double quotes
    .replace(/\u2026/g, '...')   // ellipsis char → three dots
    .replace(/\*\*/g, '')        // bold markdown
    .replace(/^#{1,6}\s/gm, '')  // markdown headings
    .replace(/  +/g, ' ')        // collapse multiple spaces
    .trim();
}

function cleanResult(result) {
  return {
    hookOptions: (result.hookOptions || []).map(cleanAiSlop),
    finalPost: cleanAiSlop(result.finalPost || ''),
    alternativeVersion: cleanAiSlop(result.alternativeVersion || ''),
    suggestedCTA: cleanAiSlop(result.suggestedCTA || ''),
    hashtags: (result.hashtags || []).map((h) => h.replace(/^#/, '').trim()).filter(Boolean),
  };
}

function buildStyleInstructions(profile) {
  if (!profile) {
    return `No writing style profile available. Use a professional, conversational LinkedIn tone.
Default style:
- Tone: Professional yet approachable
- Hook: Start with a bold or thought-provoking opening line
- Format: Short paragraphs with line breaks between them
- CTA: End with a question or invitation to discuss
- Vocabulary: Clear and accessible`;
  }

  return `Match this exact writing style:
- Tone: ${profile.tone}
- Hook style: ${profile.hookStyle}
- Formatting: ${profile.formattingStyle}
- CTA style: ${profile.ctaStyle}
- Niche: ${profile.niche}
- Authority markers to weave in naturally: ${(profile.authorityMarkers || []).join(', ') || 'none specified'}
- Vocabulary level: ${profile.vocabularyLevel}`;
}

async function generateLinkedInPost({ cleanedTranscript, keyIdeas, writingStyleProfile, userName, linkedinUrl, selectedHook, authorProfile }) {
  const styleInstructions = buildStyleInstructions(writingStyleProfile);

  const hookContext = selectedHook
    ? `\nThe user selected this hook to build the post around: "${selectedHook}"\nUse this hook as the opening line and build the rest of the post from it.`
    : '';

  const messages = [
    {
      role: 'system',
      content: `You are an elite LinkedIn ghostwriter who transforms voice notes into high-authority LinkedIn posts. You write content that positions the author as a thought leader in their space.

CRITICAL RULES:
- Write in the user's authentic voice — never sound like generic AI
- NEVER fabricate achievements, job titles, company names, or credentials
- NEVER hallucinate specific numbers, metrics, or claims not in the transcript
- Only reference what the user actually said
- Avoid clichés: "In today's fast-paced world", "game-changer", "at the end of the day", "it's not about X, it's about Y" (unless the user literally said it)
- Use LinkedIn-native formatting: line breaks between short paragraphs, no headers or markdown

EMOJIS:
- Use 2-5 relevant emojis in the post to make it feel like a modern LinkedIn post (e.g. in the hook, key points, or CTA). Choose emojis that fit the topic and tone (e.g. 💡 🚀 ✅ 📌 🔥). Do not overdo it; keep it professional and natural.

PROFILE & ONBOARDING CONTEXT (use this in every post):
- Always use the author's profile details (gender, age range, industry, content goal) and writing style to tailor: tone, vocabulary level, examples, and references. E.g. a "21-24" "Tech / SaaS" user building "personal brand" should get different tone and references than a "45-54" "Healthcare" user aiming for "thought leadership".
- Weave in their industry and content goal so the post feels personal and aligned with why they are posting.

AUTHORITY REFRAMING LOGIC:
When the user describes an experience like "I built something" or "I did X":
Reframe it as insight: "While building X, I noticed something most people overlook..."
This positions them as someone sharing wisdom, not bragging.

${styleInstructions}

FORMATTING RULES:
- Use simple hyphens (-) for dashes, NEVER em-dashes or en-dashes (never use — or –)
- Write clean punctuation: no double-dashes (--)
- No markdown syntax (no **, ##, etc.)

STRUCTURE YOUR OUTPUT:
1. Three different hook options (opening lines) — each should be a distinct style (e.g., story, contrarian, question)
2. A complete LinkedIn post (300-500 words) using the best hook. Write a substantial post: expand on the key ideas, add concrete details or examples where appropriate, and ensure the post feels complete and thought-leader quality. Do not write a short or skimpy post.
3. An alternative version (also 300-500 words) with a different angle
4. A suggested CTA that matches the user's style
5. 4-6 relevant hashtags for the post (without the # symbol, just the words)

Return ONLY valid JSON:
{
  "hookOptions": ["Hook 1", "Hook 2", "Hook 3"],
  "finalPost": "Complete post with line breaks...",
  "alternativeVersion": "Alternative version...",
  "suggestedCTA": "Suggested CTA line...",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4"]
}`,
    },
    {
      role: 'user',
      content: `AUTHOR PROFILE (use this to tailor tone, vocabulary, examples, and content goal):
- Name: ${userName}
${linkedinUrl ? `- LinkedIn: ${linkedinUrl}` : ''}
${authorProfile ? `- Gender: ${authorProfile.gender || 'Not specified'}
- Age range: ${authorProfile.ageRange || 'Not specified'}
- Industry: ${authorProfile.industry || 'Not specified'}
- Content goal: ${authorProfile.contentGoal || 'Not specified'}` : ''}

Transcript from voice note:
"${cleanedTranscript}"

Key ideas extracted:
${keyIdeas.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}
${hookContext}

Generate the LinkedIn post now. Keep the author's profile and onboarding answers in mind: match tone and vocabulary to their age and industry, align the message with their content goal, and use 2-5 relevant emojis so it feels like a real LinkedIn post.`,
    },
  ];

  const result = await chatCompletion(messages, { temperature: 0.8, maxTokens: 4000 });

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return cleanResult(JSON.parse(cleaned));
  } catch {
    throw new Error('Failed to parse generated post. Please try again.');
  }
}

module.exports = { generateLinkedInPost };
