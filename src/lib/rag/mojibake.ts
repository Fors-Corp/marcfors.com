/**
 * Repair UTF-8 text that was mis-decoded as a single-byte Western/Central
 * European encoding (ISO-8859-2, Windows-1250, Windows-1252 / Latin-1).
 *
 * Classic symptom on Ask: "está" → "estĂĄ" (ISO-8859-2) or "estĂˇ"
 * (Windows-1250) or "estÃ¡" (Windows-1252). Prefer an encode→UTF-8 round-trip
 * over hand-maintained digraph tables so every accent in those pages is covered.
 */

const MOJIBAKE_MARKER = /[ĂÃÂ]/;

/** Labels TextDecoder accepts for the encodings we reverse. */
const LEGACY_LABELS = ["iso-8859-2", "windows-1250", "windows-1252"] as const;

type LegacyLabel = (typeof LEGACY_LABELS)[number];

const byteMaps = new Map<LegacyLabel, Map<number, number>>();

function byteMapFor(label: LegacyLabel): Map<number, number> {
  const cached = byteMaps.get(label);
  if (cached) return cached;
  const decoder = new TextDecoder(label);
  const map = new Map<number, number>();
  for (let byte = 0; byte < 256; byte += 1) {
    const char = decoder.decode(Uint8Array.of(byte));
    // Skip unmapped slots (Windows-1252 has holes that become U+FFFD).
    if (char.length !== 1) continue;
    const code = char.charCodeAt(0);
    if (code === 0xfffd) continue;
    map.set(code, byte);
  }
  byteMaps.set(label, map);
  return map;
}

function encodeLegacy(text: string, label: LegacyLabel): Uint8Array | null {
  const map = byteMapFor(label);
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code <= 0x7f) {
      out[i] = code;
      continue;
    }
    const byte = map.get(code);
    if (byte === undefined) return null;
    out[i] = byte;
  }
  return out;
}

function tryRoundTrip(text: string, label: LegacyLabel): string | null {
  const bytes = encodeLegacy(text, label);
  if (!bytes) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Higher is better. Penalize leftover mojibake markers and symbols that show
 * up when the wrong legacy page is used for the round-trip (e.g. CP1250
 * "Ăˇ" re-encoded as ISO-8859-2 yields UTF-8 "÷").
 */
function repairQuality(text: string): number {
  let score = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (char === "Ă" || char === "Ã" || char === "Â") score -= 6;
    // Soft hyphen often pairs with Ă for í under Latin-2 / CP1250.
    if (char === "\u00AD") score -= 2;
    // × ÷ land when C3 B7 / C3 97 are treated as UTF-8 by mistake.
    if (code === 0xd7 || code === 0xf7) score -= 10;
    // Latin-1 letters with diacritics (skip the multiplication/division signs).
    if (code >= 0xc0 && code <= 0xff && code !== 0xd7 && code !== 0xf7) {
      score += 2;
    }
  }
  return score;
}

export function looksLikeUtf8Mojibake(text: string): boolean {
  return MOJIBAKE_MARKER.test(text);
}

/**
 * Return text with UTF-8-as-legacy-single-byte mojibake restored.
 * Idempotent on already-correct Spanish/Catalan/English Unicode.
 */
export function repairUtf8Mojibake(text: string): string {
  if (!looksLikeUtf8Mojibake(text)) return text;

  let best = text;
  let bestScore = repairQuality(text);

  for (const label of LEGACY_LABELS) {
    const candidate = tryRoundTrip(text, label);
    if (candidate === null || candidate === text) continue;
    const score = repairQuality(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}
