/** Stopwords for lexical retrieve fallback (meta / conversational asks). */
const STOP = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "at",
  "for",
  "from",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "am",
  "do",
  "does",
  "did",
  "can",
  "could",
  "would",
  "should",
  "will",
  "my",
  "me",
  "you",
  "your",
  "our",
  "their",
  "this",
  "that",
  "these",
  "those",
  "what",
  "which",
  "who",
  "whom",
  "where",
  "when",
  "why",
  "how",
  "about",
  "into",
  "over",
  "under",
  "please",
  "just",
  "any",
  "all",
  "not",
  "no",
  "yes",
]);

/** Escape `%` / `_` so user text cannot widen ILIKE matches. */
export function escapeIlike(token: string): string {
  return token.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Significant tokens for phrase-miss lexical fallback.
 * Keeps short all-letter tokens like "CV" (length 2) when not stopwords.
 */
export function significantTokens(question: string): string[] {
  const raw = question.match(/[A-Za-z0-9][A-Za-z0-9._-]*/g) || [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const token of raw) {
    const lower = token.toLowerCase();
    if (STOP.has(lower)) continue;
    if (token.length < 2) continue;
    if (token.length === 2 && !/^[A-Za-z]{2}$/.test(token)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(token);
    if (out.length >= 8) break;
  }
  return out;
}
