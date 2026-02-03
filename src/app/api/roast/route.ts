import { scrapeUrl } from '@/lib/scraper';
import { Language, RoastLevel } from '@/types';
import { createFireworks } from '@ai-sdk/fireworks';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY
});

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { url, level, language } = await req.json();

    // 1. Try direct scraping first
    const scrapedData = await scrapeUrl(url);
    const hasScrapedContext = !!scrapedData;

    const providerType = process.env.PROVIDER_TYPE || 'openrouter';

    let model;

    if (providerType === 'fireworks') {
      if (!process.env.FIREWORKS_API_KEY) {
        throw new Error('Fireworks API Key is missing.');
      }
      if (!process.env.FIREWORKS_MODEL) {
        throw new Error('Fireworks Model is missing.');
      }
      model = fireworks(process.env.FIREWORKS_MODEL);
    } else {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API Key is missing.');
      }

      if (!process.env.OPENROUTER_MODEL) {
        throw new Error('OpenRouter Model is missing.');
      }

      const useWebSearch = process.env.USE_WEB_SEARCH === 'true';
      const shouldSearch = useWebSearch && !hasScrapedContext;

      const plugins = shouldSearch
        ? [
            {
              id: 'web' as const,
              engine: 'exa' as const,
              max_results: 3,
              search_prompt: 'Find details about the website/profile at: ' + url
            }
          ]
        : [];

      model = openrouter(process.env.OPENROUTER_MODEL, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        plugins: plugins as any
      });
    }

    if (!model) {
      throw new Error('Failed to initialize AI model');
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
      - USE WEB SEARCH to find specific details about the URL content if it's not obvious.
      - DO NOT INVENT or hallucinate information. You are a detective first, a roaster second.
      - DATA HARVESTING: Search for specific page titles, meta tags, project names, and bio snippets.
      - If the URL is for GitHub, identify at least one specific repository name or the main bio text.
      - If the URL is for LinkedIn, identify the specific job title or the first sentence of the 'About' section.
      - If the URL is for a Portfolio, identify the tech stack (e.g., 'Another React portfolio', 'Using Framer Motion just because').
      
      CONSTRAINTS:
      - Roast Level: ${level} (${levelDescriptions[level as RoastLevel]})
      - Language: ${languageInstruction}
      - Style: One or two high-impact, witty paragraphs.
      - NO HALLUCINATIONS: If you absolutely cannot find any specific info about the URL, admit it in the roast.

      SCRAPED CONTEXT (Use this PRIORITY if available):
      ${
        scrapedData
          ? `
        Title: ${scrapedData.title}
        Description: ${scrapedData.description}
        Headings: ${scrapedData.headings.join(', ')}
        Key Content: ${scrapedData.paragraphs.join('\n')}
        Links: ${scrapedData.links.map((l) => l.text + ' (' + l.href + ')').join(', ')}
        Meta: ${JSON.stringify(scrapedData.meta)}
        `
          : 'Direct scraping failed or returned empty. Rely on web search or general knowledge.'
      }
    `;

    const { output } = await generateText({
      model,
      prompt,
      output: Output.object({
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
      })
    });

    return Response.json({
      ...output,
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
