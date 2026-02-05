import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedContent {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: { text: string; href: string }[];
  socialLinks: { platform: string; url: string }[];
  meta: Record<string, string>;
  techStack: string[];
  jsonLd?: Record<string, unknown>[];
}

export async function scrapeUrl(url: string): Promise<ScrapedContent | null> {
  try {
    const { data } = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: (status) => status < 500,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000 // 10 seconds timeout
    });

    const $ = cheerio.load(data);

    // cleanup unrelated content
    $('script, style, noscript, iframe, svg, link[rel="stylesheet"]').remove();

    const techStack: string[] = [];
    const htmlLower = data.toLowerCase();

    // Basic tech stack detection
    if ($('#__next').length || htmlLower.includes('next.js'))
      techStack.push('Next.js');
    if ($('#root').length || $('[data-reactroot]').length)
      techStack.push('React');
    if ($('[x-data]').length) techStack.push('Alpine.js');
    if (
      $('meta[name="generator"]')
        .attr('content')
        ?.toLowerCase()
        .includes('wordpress') ||
      htmlLower.includes('wp-content')
    )
      techStack.push('WordPress');
    if ($('script[src*="jquery"]').length) techStack.push('jQuery');
    if (htmlLower.includes('tails') || htmlLower.includes('tailwind'))
      techStack.push('Tailwind CSS');
    if (htmlLower.includes('bootstrap')) techStack.push('Bootstrap');
    if (
      $('meta[name="generator"]')
        .attr('content')
        ?.toLowerCase()
        .includes('framer')
    )
      techStack.push('Framer');
    if (
      $('meta[name="generator"]')
        .attr('content')
        ?.toLowerCase()
        .includes('webflow')
    )
      techStack.push('Webflow');
    if (
      $('meta[name="generator"]').attr('content')?.toLowerCase().includes('wix')
    )
      techStack.push('Wix');
    if (htmlLower.includes('vite')) techStack.push('Vite');
    if (htmlLower.includes('vue')) techStack.push('Vue.js');
    if (htmlLower.includes('svelte')) techStack.push('Svelte');

    const content: ScrapedContent = {
      title: $('title').text().trim(),
      description:
        $('meta[name="description"]').attr('content')?.trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        '',
      headings: [],
      paragraphs: [],
      links: [],
      socialLinks: [],
      meta: {},
      techStack: [...new Set(techStack)], // remove duplicates
      jsonLd: []
    };

    // Extract JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        if (json) {
          if (Array.isArray(json)) {
            content.jsonLd?.push(...json);
          } else {
            content.jsonLd?.push(json);
          }
        }
      } catch (_e) {
        // ignore invalid json
      }
    });

    // Prioritize "main" content or "about" sections for paragraphs
    const mainContent = $(
      'main, article, #content, .content, [id*="about"], [class*="about"]'
    );
    const sensitiveContext = mainContent.length ? mainContent : $('body');

    sensitiveContext.find('h1, h2, h3').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) content.headings.push(text);
    });

    // Extract paragraphs, list items, and spans (often used for skills/badges/descriptions)
    // Extract paragraphs, list items, and spans (often used for skills/badges/descriptions)
    sensitiveContext.find('p, li, span').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      // Filter out short snippets or navigation items usually found in lists or UI elements
      if (text && text.length > 20 && text.length < 500) {
        content.paragraphs.push(text);
      }
    });

    $('a').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      const href = $(el).attr('href');

      if (!href) return;

      // Check for social links
      const lowerHref = href.toLowerCase();
      if (lowerHref.includes('github.com'))
        content.socialLinks.push({ platform: 'GitHub', url: href });
      else if (lowerHref.includes('linkedin.com'))
        content.socialLinks.push({ platform: 'LinkedIn', url: href });
      else if (lowerHref.includes('twitter.com') || lowerHref.includes('x.com'))
        content.socialLinks.push({ platform: 'Twitter', url: href });
      else if (lowerHref.includes('instagram.com'))
        content.socialLinks.push({ platform: 'Instagram', url: href });
      else if (lowerHref.includes('dribbble.com'))
        content.socialLinks.push({ platform: 'Dribbble', url: href });
      else if (lowerHref.includes('behance.net'))
        content.socialLinks.push({ platform: 'Behance', url: href });

      if (
        text &&
        !href.startsWith('#') &&
        !href.startsWith('javascript') &&
        !href.startsWith('mailto') &&
        !href.startsWith('tel') &&
        text.length > 3 // Ignore very short links like "Go", "Hi"
      ) {
        content.links.push({ text, href });
      }
    });

    // Extract meaningful meta tags
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property');
      const contentValue = $(el).attr('content');
      if (name && contentValue) {
        // Prioritize interesting meta tags
        if (
          [
            'keywords',
            'author',
            'og:title',
            'og:site_name',
            'twitter:site',
            'twitter:creator',
            'application-name'
          ].includes(name) ||
          name.startsWith('og:') ||
          name.startsWith('twitter:')
        ) {
          content.meta[name] = contentValue;
        }
      }
    });

    // Limit the amount of content to avoid token limits, but take slightly more than before
    content.paragraphs = content.paragraphs.slice(0, 30); // Increased from 10 to 20, now 30
    content.links = content.links.slice(0, 15); // Increased from 10

    // Quality check: ensure we actually got some meaningful content
    const hasContent =
      content.paragraphs.length > 0 ||
      content.headings.length > 0 ||
      content.techStack.length > 0 ||
      Object.keys(content.meta).length > 0;

    if (!hasContent) {
      return null;
    }

    // Check for common blocking/captcha pages that might result in a 200 OK
    const titleLower = content.title.toLowerCase();
    if (
      titleLower.includes('access denied') ||
      titleLower.includes('captcha') ||
      titleLower.includes('challenge') ||
      titleLower.includes('cloudflare') ||
      titleLower.includes('403 forbidden')
    ) {
      return null;
    }

    return content;
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}
