import { scrapeUrl } from '@/lib/scraper';
import { Language, RoastLevel } from '@/types';
import { createFireworks } from '@ai-sdk/fireworks';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});

const fireworks = createFireworks({
  apiKey: process.env.FIREWORKS_API_KEY
});

import redis from '@/lib/redis';
import { cookies } from 'next/headers';

export const maxDuration = 60;

const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_NEW_SESSIONS_PER_IP = 5;
const RATE_LIMIT_IP_FALLBACK = 30;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const cookieStore = await cookies();
    let userId = cookieStore.get('user-id')?.value;
    const today = new Date().toISOString().split('T')[0];

    const ipKey = `ip:${ip}:${today}:count`;
    const ipCount = await redis.incr(ipKey);
    if (ipCount === 1) await redis.expire(ipKey, 86400); // 1 day

    if (ipCount > RATE_LIMIT_IP_FALLBACK) {
      return Response.json(
        { error: 'Too many requests from this IP. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    if (!userId) {
      const ipRegistrationKey = `ip:${ip}:${today}:registrations`;
      const registrationCount = await redis.incr(ipRegistrationKey);
      if (registrationCount === 1) await redis.expire(ipRegistrationKey, 86400);

      if (registrationCount > RATE_LIMIT_NEW_SESSIONS_PER_IP) {
        return Response.json(
          {
            error:
              'Too many new sessions from your network. Please try again later.'
          },
          { status: 429 }
        );
      }

      userId = crypto.randomUUID();
      cookieStore.set('user-id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/'
      });
    }

    const userKey = `user:${userId}:${today}:count`;
    const userCount = await redis.incr(userKey);
    if (userCount === 1) await redis.expire(userKey, 86400);

    if (userCount > RATE_LIMIT_MAX_REQUESTS) {
      return Response.json(
        {
          error:
            'You have reached your daily roast limit (10/day). Come back tomorrow!'
        },
        { status: 429 }
      );
    }

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
      Your goal is to roast the PERSON or the PRODUCT behind the URL. 
      Focus on their career choices, design aesthetics, "creative" descriptions, and overall vibe.
      
      STRICT DATA INTEGRITY PROTOCOL:
      - USE WEB SEARCH to find specific details about the URL content if it's not obvious.
      - DO NOT focus on technical metadata like "og:tags" or "meta keywords" unless they are exceptionally cringe.
      - DATA HARVESTING: Focus on Bio snippets, Job titles, Repository names, Project descriptions, and the 'Voice' of the content.
      - If the URL is for GitHub, roast their contribution graph, pinning choices, or overly ambitious project names.
      - If the URL is for LinkedIn, roast the "LinkedIn influencer" energy, generic buzzwords, or the "Open to Work" desperation/confidence.
      - If the URL is for a Portfolio, roast the predictable tech stack (Next.js + Tailwind + Framer Motion triplet) and the generic "Passion for UX" lines.
      
      CONSTRAINTS:
      - Roast Level: ${level} (${levelDescriptions[level as RoastLevel]})
      - Language: ${languageInstruction}
      - Style: One or two high-impact, witty paragraphs. Focus on the 'Vibe' and 'Persona'.
      - NO HALLUCINATIONS: If you absolutely cannot find any specific info about the URL, admit it in the roast.

      SCRAPED CONTEXT (Use this PRIORITY if available):
      ${
        scrapedData
          ? `
        Title: ${scrapedData.title}
        Description: ${scrapedData.description}
        Tech Stack: ${scrapedData.techStack?.join(', ') || 'Unknown'}
        Main Headings: ${scrapedData.headings.join(', ')}
        Content Snippets: ${scrapedData.paragraphs.join('\n')}
        Links & Navigation: ${scrapedData.links.map((l) => l.text + ' (' + l.href + ')').join(', ')}
        Technical Metadata (Secondary): ${JSON.stringify(scrapedData.meta)}
        `
          : 'Direct scraping failed or returned empty. Rely on web search or general knowledge.'
      }

      RESPONSE FORMAT:
      You EXCEPTIONAL GOAL is to return a VALID JSON string.
      Do not include any conversational text, markdown code blocks, or explanations outside the JSON.
      
      The JSON object must follow this schema:
      {
        "summary": "A sharp 5-10 word summary/title",
        "roastContent": "The full roast paragraph(s)",
        "burnScore": number (between 0 and 100),
        "sources": [
          { "title": "Source Title", "uri": "Source URL" }
        ]
      }
    `;

    const { text } = await generateText({
      model,
      prompt
    });

    let jsonResponse;
    try {
      // Clean up potential markdown code blocks
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      jsonResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', text, parseError);
      // Fallback if parsing fails - attempt to wrap text in a valid structure
      jsonResponse = {
        summary: 'Roast Generation Error',
        roastContent: text, // Return the raw text as content so the user at least sees something
        burnScore: 0,
        sources: []
      };
    }

    return Response.json({
      ...jsonResponse,
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
