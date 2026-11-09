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
  // Romance / German fillers that show up in localized Ask questions
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "de",
  "del",
  "en",
  "es",
  "qué",
  "que",
  "cuál",
  "cual",
  "dónde",
  "donde",
  "como",
  "cómo",
  "por",
  "para",
  "con",
  "sin",
  "más",
  "mas",
  "hay",
  "tiene",
  "sobre",
  "seu",
  "sua",
  "um",
  "uma",
  "der",
  "die",
  "das",
  "und",
  "ist",
  "was",
  "wie",
  "wo",
]);

/** Stable CV citation path (must match scripts/rag/extractCv.ts). */
export const CV_SOURCE_PATH = "cv/marc-fors-cv.pdf";

/** Escape `%` / `_` so user text cannot widen ILIKE matches. */
export function escapeIlike(token: string): string {
  return token.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Fold accents for ES/CA lexical matching (NFD + strip combining marks). */
export function foldAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

/**
 * Significant tokens for phrase-miss lexical fallback.
 * Keeps short all-letter tokens like "CV" (length 2) when not stopwords.
 * Uses Unicode letters so Spanish/Catalan questions tokenize.
 */
export function significantTokens(question: string): string[] {
  const raw = question.match(/[\p{L}\p{N}][\p{L}\p{N}._-]*/gu) || [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const token of raw) {
    const lower = foldAccents(token.toLowerCase());
    if (STOP.has(token.toLowerCase()) || STOP.has(lower)) continue;
    if (token.length < 2) continue;
    if (token.length === 2 && !/^[\p{L}]{2}$/u.test(token)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(token);
    if (out.length >= 8) break;
  }
  return out;
}

/**
 * True when the retrieved text actually contains the question's content words.
 * One shared name ("Marc") is not enough; two content words must appear.
 * Accent-folded so "dónde" / "donde" still cover "Barcelona".
 */
export function contextCoversQuestion(blob: string, question: string): boolean {
  const tokens = significantTokens(question);
  if (tokens.length === 0) return blob.trim().length > 0;
  const haystack = foldAccents(blob.toLowerCase());
  const hits = tokens.filter((token) =>
    haystack.includes(foldAccents(token.toLowerCase())),
  );
  return hits.length >= Math.min(2, tokens.length);
}

/**
 * Filenames / paths named in the question (marc-fors-cv.pdf, cv/…).
 * When present, retrieve those sources first and skip the distance gate.
 */
export function namedSourcePaths(question: string): string[] {
  const lower = question.toLowerCase();
  const found = new Set<string>();
  if (
    lower.includes("marc-fors-cv.pdf") ||
    lower.includes("marc_fors_cv") ||
    /cv\/marc-fors-cv\.pdf/.test(lower)
  ) {
    found.add(CV_SOURCE_PATH);
  }
  for (const match of question.matchAll(
    /\b([\w./-]+\.(?:pdf|md|txt))\b/gi,
  )) {
    const name = match[1]!.replace(/\\/g, "/");
    if (/marc-fors-cv\.pdf/i.test(name) || /Marc_Fors_CV/i.test(name)) {
      found.add(CV_SOURCE_PATH);
    }
  }
  return [...found];
}

/**
 * True when the ask is about the CV / résumé rather than a case study.
 * Forces a CV path retrieve so project markdown does not crowd out bio facts.
 */
export function prefersCvSource(question: string): boolean {
  return /\b(cv|resume|résumé|curriculum|vitae|currículum|documento|pdf)\b/i.test(
    question,
  );
}

export type LexicalHit = {
  content: string;
  source_path: string;
  chunk_index: number;
  tokenHits?: number;
};

/** Rank lexical rows by multi-token overlap; prefer CV path matches. */
export function rankLexicalHits(
  hits: LexicalHit[],
  tokens: string[],
  limit: number,
): LexicalHit[] {
  const foldedTokens = tokens.map((t) => foldAccents(t.toLowerCase()));
  const scored = hits.map((hit) => {
    const hay = foldAccents(`${hit.source_path}\n${hit.content}`.toLowerCase());
    const tokenHits = foldedTokens.filter((t) => hay.includes(t)).length;
    const cvBoost = hit.source_path.startsWith("cv/") ? 2 : 0;
    const pathBoost = foldedTokens.some((t) =>
      foldAccents(hit.source_path.toLowerCase()).includes(t),
    )
      ? 1
      : 0;
    return { hit: { ...hit, tokenHits }, score: tokenHits * 10 + cvBoost + pathBoost };
  });
  scored.sort((a, b) => b.score - a.score || a.hit.chunk_index - b.hit.chunk_index);
  const seen = new Set<string>();
  const out: LexicalHit[] = [];
  for (const row of scored) {
    const key = `${row.hit.source_path}::${row.hit.chunk_index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row.hit);
    if (out.length >= limit) break;
  }
  return out;
}

/** Reciprocal rank fusion (k=60) over two ranked lists of chunk keys. */
export function reciprocalRankFusion(
  lists: Array<Array<{ key: string; row: LexicalHit & { distance?: number } }>>,
  limit: number,
  k = 60,
): Array<LexicalHit & { distance: number }> {
  const scores = new Map<string, { score: number; row: LexicalHit & { distance?: number } }>();
  for (const list of lists) {
    list.forEach((entry, index) => {
      const add = 1 / (k + index + 1);
      const prev = scores.get(entry.key);
      if (prev) {
        prev.score += add;
      } else {
        scores.set(entry.key, { score: add, row: entry.row });
      }
    });
  }
  return [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([, value]) => ({
      content: value.row.content,
      source_path: value.row.source_path,
      chunk_index: value.row.chunk_index,
      distance: Number.isFinite(value.row.distance) ? Number(value.row.distance) : 0,
    }));
}
