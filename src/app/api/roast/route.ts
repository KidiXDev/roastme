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
      const shouldSearch = useWebSearch;

      if (
        !useWebSearch &&
        (!hasScrapedContext || scrapedData.paragraphs.length < 2)
      ) {
        return Response.json(
          {
            error:
              'Unable to scrape website content and Web Search is disabled. Please try a different URL or enable Web Search.'
          },
          { status: 400 }
        );
      }

      const plugins = shouldSearch
        ? [
            {
              id: 'web' as const,
              engine: 'exa' as const,
              max_results: 3,
              search_prompt:
                'Find detailed professional and personal info about: ' + url
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

    // --- PROMPT CHAINING START ---

    let analysisContext = '';

    if (hasScrapedContext && scrapedData) {
      const analysisSystemPrompt = `
        You are an Expert Content Analyst & Professional Hater.
        Your task is to analyze website content and extract specific material for a savage roast.
        Focus on:
        1. THE VIBE (Desperate, overly corporate, chaotic, etc.)
        2. THE CRINGE (Buzzwords, clichés, pretentious claims)
        3. THE TECH (Outdated stacks, over-engineering, cookie-cutter templates)
        4. THE INCONSISTENCIES (Bio vs Reality)
        
        Do not write the roast yet. Just return the raw ammunition (analysis).
      `;

      const analysisUserContent = `
        TARGET URL: ${url}
        
        RAW SCRAPED CONTENT:
        Title: ${scrapedData.title}
        Description: ${scrapedData.description}
        Tech Stack: ${scrapedData.techStack?.join(', ') || 'Unknown'}
        Social Links: ${scrapedData.socialLinks?.map((l) => l.platform + ': ' + l.url).join(', ')}
        Headings: ${scrapedData.headings.join(' | ')}
        Content Snippets: ${scrapedData.paragraphs.slice(0, 15).join('\n')}
        Validation/Metadata: ${JSON.stringify(scrapedData.meta)}
        JSON-LD Data: ${JSON.stringify(scrapedData.jsonLd || {})}
        
        Please provide the concise summary (max 200 words) as requested.
      `;

      try {
        const { text: analysisResult } = await generateText({
          model,
          system: analysisSystemPrompt,
          prompt: analysisUserContent
        });
        analysisContext = analysisResult;
      } catch (err) {
        console.warn('Analysis step failed, proceeding to direct roast', err);
      }
    }

    const levelDescriptions = {
      [RoastLevel.SANTAI]:
        'gentle, playful, and friendly. Like a friend teasing another friend.',
      [RoastLevel.NORMAL]:
        'witty, slightly savage, and cleverly critical. Focus on professional competence and design choices.',
      [RoastLevel.PEDES]:
        'destructive, emotional damage, and hilariously honest. No mercy. Attack the ego.'
    };

    const languageInstruction =
      language === Language.ID
        ? "Translate all your responses to Indonesian (Bahasa Indonesia). Use a mix of formal and slang ('bahasa gaul') tech terms like 'agak laen', 'minimalis tapi kosong', 'sok iye', 'kaum mendang-mending', 'tutorial hell victim'. Sound like a toxic senior dev from Jakarta Selatan."
        : 'Generate all responses in English. Use tech-sarcastic and witty language. Use modern dev tropes, design memes, and Silicon Valley/Indie Hacker clichés.';

    const roastSystemPrompt = `
      You are "ROASTMASTER-3000", a legendary roasting AI agent.
      
      YOUR MISSION:
      Create a roasting profile for the provided user/website.
      Your goal is to be funny, accurate, and insightful. 
      Avoid generic insults like "your site is ugly". match the specific details found in the analysis.
      
      GUIDELINES:
      - MODE: ${level} (${levelDescriptions[level as RoastLevel]})
      - LANGUAGE: ${languageInstruction}
      - If it's a PORTFOLIO: Roast the stack, the "About Me" clichés, and the lack of real projects.
      - If it's a GITHUB: Roast the commit history, the forked repos, and the readme badges.
      - If it's a LINKEDIN: Roast the job titles, the "helping companies scale" nonsense.
      - If it's a SAAS: Roast the pricing model, the "AI-powered" claim, and the generic landing page copy.

      RESPONSE STRUCTURE (STRICT JSON):
      You must return ONLY a JSON object. No markdown formatting outside the JSON string.
      
      {
        "summary": "A punchy, 5-10 word title defining their existence",
        "roastContent": "The main roast. 2-3 paragraphs. rich in specific details. Use HTML formatting tags like <b>, <i>, <br> if needed for emphasis.",
        "burnScore": number (0-100),
        "sources": [
          { "title": "Source Name", "uri": "URL" } 
        ]
      }
    `;

    const roastUserContent = `
      TARGET: ${url}
      
      INPUT DATA:
      ${
        analysisContext
          ? `
      ### PRELIMINARY ANALYSIS REPORT:
      ${analysisContext}
      `
          : `
      ### WEB SEARCH / KNOWLEDGE:
      (Use your internal knowledge and web search tools to analyze this URL)
      `
      }

      ### SCRAPED TECHNICAL DETAILS:
      ${
        hasScrapedContext && scrapedData
          ? `
      - Title: ${scrapedData.title}
      - Tech Stack: ${scrapedData.techStack?.join(', ')}
      - Socials: ${scrapedData.socialLinks?.map((l) => l.platform).join(', ')}
      `
          : 'No direct scrape available. Rely heavily on web search.'
      }
      
      Generate the JSON roast now.
    `;

    const { text } = await generateText({
      model,
      system: roastSystemPrompt,
      prompt: roastUserContent
    });

    let jsonResponse;
    try {
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      jsonResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', text, parseError);
      jsonResponse = {
        summary: 'Roast Generation Error',
        roastContent: text,
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
