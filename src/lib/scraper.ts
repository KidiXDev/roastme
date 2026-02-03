import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: { text: string; href: string }[];
  meta: Record<string, string>;
}

export async function scrapeUrl(url: string): Promise<ScrapedContent | null> {
  try {
    const { data } = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 seconds timeout
    });

    const $ = cheerio.load(data);
    const content: ScrapedContent = {
      title: $('title').text().trim(),
      description:
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '',
      headings: [],
      paragraphs: [],
      links: [],
      meta: {}
    };

    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text) content.headings.push(text);
    });

    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 50) {
        // Filter out short snippets
        content.paragraphs.push(text);
      }
    });

    $('a').each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (
        text &&
        href &&
        !href.startsWith('#') &&
        !href.startsWith('javascript')
      ) {
        content.links.push({ text, href });
      }
    });

    // Extract meaningful meta tags
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property');
      const contentValue = $(el).attr('content');
      if (name && contentValue) {
        content.meta[name] = contentValue;
      }
    });

    // Limit the amount of content to avoid token limits
    content.paragraphs = content.paragraphs.slice(0, 10);
    content.links = content.links.slice(0, 10);

    return content;
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}
