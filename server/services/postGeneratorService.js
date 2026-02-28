const { chatCompletion } = require('./azureClient');

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

async function generateLinkedInPost({ cleanedTranscript, keyIdeas, writingStyleProfile, userName, linkedinUrl, selectedHook }) {
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
- Avoid emojis unless the user's style profile indicates frequent emoji use
- Use LinkedIn-native formatting: line breaks between short paragraphs, no headers or markdown

AUTHORITY REFRAMING LOGIC:
When the user describes an experience like "I built something" or "I did X":
Reframe it as insight: "While building X, I noticed something most people overlook..."
This positions them as someone sharing wisdom, not bragging.

${styleInstructions}

STRUCTURE YOUR OUTPUT:
1. Three different hook options (opening lines) — each should be a distinct style (e.g., story, contrarian, question)
2. A complete LinkedIn post (150-300 words) using the best hook
3. An alternative version with a different angle
4. A suggested CTA that matches the user's style

Return ONLY valid JSON:
{
  "hookOptions": ["Hook 1", "Hook 2", "Hook 3"],
  "finalPost": "Complete post with line breaks...",
  "alternativeVersion": "Alternative version...",
  "suggestedCTA": "Suggested CTA line..."
}`,
    },
    {
      role: 'user',
      content: `Author: ${userName}
${linkedinUrl ? `LinkedIn: ${linkedinUrl}` : ''}

Transcript from voice note:
"${cleanedTranscript}"

Key ideas extracted:
${keyIdeas.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}
${hookContext}

Generate the LinkedIn post now.`,
    },
  ];

  const result = await chatCompletion(messages, { temperature: 0.8, maxTokens: 2500 });

  try {
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse generated post. Please try again.');
  }
}

module.exports = { generateLinkedInPost };
