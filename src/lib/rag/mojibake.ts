/**
 * Repair UTF-8 text that was mis-decoded as Windows-1250 / Windows-1252
 * (classic mojibake: "Sí" → "SĂ­"/"SĂ\xad", "está" → "estĂˇ"/"estÃ¡").
 *
 * Live Ask answers sometimes arrive from the chat model already corrupted
 * this way. Digraph replacement fixes mixed strings without touching correct
 * Spanish/Catalan/English Unicode.
 */

/** Longer sequences first so soft-hyphen and multi-byte tails match cleanly. */
const MOJIBAKE_DIGRAPHS: ReadonlyArray<readonly [string, string]> = [
  // UTF-8 read as Windows-1250 (Central European) — matches production Ask.
  ["Ă\u00AD", "í"],
  ["Ăˇ", "á"],
  ["Ă©", "é"],
  ["Ăł", "ó"],
  ["Ăş", "ú"],
  ["Ă±", "ñ"],
  ["Ă\u00A0", "à"],
  ["Ă¨", "è"],
  ["Ă¬", "ì"],
  ["Ă˛", "ò"],
  ["Ăą", "ù"],
  ["Ă§", "ç"],
  ["ĂĽ", "ü"],
  ["Ă¤", "ä"],
  ["Ă«", "ë"],
  ["ĂŻ", "ï"],
  ["Ă¶", "ö"],
  ["Ăź", "ß"],
  ["Ă€", "À"],
  ["Ă‰", "É"],
  ["ĂŤ", "Í"],
  ["Ă“", "Ó"],
  ["Ăš", "Ú"],
  ["Ă‘", "Ñ"],
  ["Ă‡", "Ç"],
  ["Ă’", "Ò"],
  ["Ă™", "Ù"],
  ["ĂŚ", "Ì"],
  ["Ă„", "Ä"],
  ["Ă–", "Ö"],
  ["Ăś", "Ü"],
  ["Âż", "¿"],
  ["Âˇ", "¡"],
  // UTF-8 read as Windows-1252 / Latin-1.
  ["Ã\u00AD", "í"],
  ["Ã¡", "á"],
  ["Ã©", "é"],
  ["Ã³", "ó"],
  ["Ãº", "ú"],
  ["Ã±", "ñ"],
  ["Ã\u00A0", "à"],
  ["Ã¨", "è"],
  ["Ã¬", "ì"],
  ["Ã²", "ò"],
  ["Ã¹", "ù"],
  ["Ã§", "ç"],
  ["Ã¼", "ü"],
  ["Ã¤", "ä"],
  ["Ã«", "ë"],
  ["Ã¯", "ï"],
  ["Ã¶", "ö"],
  ["ÃŸ", "ß"],
  ["Ã€", "À"],
  ["Ã‰", "É"],
  ["Ã“", "Ó"],
  ["Ãš", "Ú"],
  ["Ã‘", "Ñ"],
  ["Ã‡", "Ç"],
  ["Ãˆ", "È"],
  ["ÃŒ", "Ì"],
  ["Ã’", "Ò"],
  ["Ã™", "Ù"],
  ["Ã„", "Ä"],
  ["Ã–", "Ö"],
  ["Ãœ", "Ü"],
  ["Â¿", "¿"],
  ["Â¡", "¡"],
];

const MOJIBAKE_MARKER = /[ĂÃÂ]/;

export function looksLikeUtf8Mojibake(text: string): boolean {
  return MOJIBAKE_MARKER.test(text);
}

/** Return text with known UTF-8-as-cp1250/cp1252 digraphs restored. Idempotent. */
export function repairUtf8Mojibake(text: string): string {
  if (!looksLikeUtf8Mojibake(text)) return text;
  let out = text;
  for (const [bad, good] of MOJIBAKE_DIGRAPHS) {
    if (out.includes(bad)) out = out.split(bad).join(good);
  }
  return out;
}
