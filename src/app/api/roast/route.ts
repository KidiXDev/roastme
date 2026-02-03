import { Language, RoastLevel } from '@/types';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { url, level, language } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API Key is missing.');
    }

    const levelDescriptions = {
      [RoastLevel.SANTAI]: "gentle, playful, and friendly. It's a light poke.",
      [RoastLevel.NORMAL]:
        'witty, slightly savage, and cleverly critical. A fun roast for pros.',
      [RoastLevel.PEDES]:
        'sharp, brutal, and hilariously honest. Ruthless professional critique.'
    };

    const languageInstruction =
      language === Language.ID
        ? "Translate all your responses to Indonesian (Bahasa Indonesia). Use a mix of formal and slang ('bahasa gaul') tech terms like 'agak laen', 'minimalis tapi kosong', 'over-engineered', 'pencitraan', 'kang post quote bijak'. Sound like a witty senior dev."
        : "Generate all responses in English. Use tech-sarcastic and witty language. Use modern dev tropes, design memes, and LinkedIn 'thought leader' cliches.";

    const prompt = `
      ROAST MISSION:
      Analyze the profile/site at: ${url}
      
      STRICT DATA INTEGRITY PROTOCOL:
      - DO NOT INVENT or hallucinate information. You are a detective first, a roaster second.
      - DATA HARVESTING: Search for specific page titles, meta tags, project names, and bio snippets.
      - If the URL is for GitHub, identify at least one specific repository name or the main bio text.
      - If the URL is for LinkedIn, identify the specific job title or the first sentence of the 'About' section.
      - If the URL is for a Portfolio, identify the tech stack (e.g., 'Another React portfolio', 'Using Framer Motion just because').
      
      CONSTRAINTS:
      - Roast Level: ${level} (${levelDescriptions[level as RoastLevel]})
      - Language: ${languageInstruction}
      - Style: One or two high-impact, witty paragraphs.
      - NO HALLUCINATIONS: If you absolutely cannot find any specific info about the URL, admit it in the roast (e.g., "This site is so empty it echoes").
    `;

    const result = await generateObject({
      model: openrouter('google/gemini-2.5-flash-lite'),
      prompt,
      schema: z.object({
        summary: z.string().describe('A sharp 5-10 word summary/title'),
        roastContent: z.string().describe('The full roast paragraph(s)'),
        burnScore: z
          .number()
          .min(0)
          .max(100)
          .describe('Burn score from 0 to 100'),
        sources: z
          .array(
            z.object({
              title: z.string().optional(),
              uri: z.string().optional()
            })
          )
          .optional()
          .describe('List of sources used for grounding, if any')
      })
    });

    return Response.json({
      ...result.object,
      roastLevel: level,
      url: url
    });
  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
