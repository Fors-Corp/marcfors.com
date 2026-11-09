/**
 * AI crawlers and user-triggered fetchers the site welcomes. `robots.txt`
 * already allows everyone; naming them records the intent (public portfolio,
 * cite me) so a future blanket rule cannot silently shut answer engines out.
 * Training and search/answer bots are listed together on purpose.
 */
export const AI_CRAWLERS = [
  // OpenAI: search index, user-triggered fetch, training crawler.
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  // Anthropic: training crawler, search index, user-triggered fetch.
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity: search index and user-triggered fetch.
  "PerplexityBot",
  "Perplexity-User",
  // Opt-in tokens for Gemini / Apple Intelligence grounding and training.
  "Google-Extended",
  "Applebot-Extended",
  // Common Crawl feeds many open models.
  "CCBot",
] as const;
