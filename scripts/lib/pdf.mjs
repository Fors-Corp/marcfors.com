import { readFileSync } from "node:fs";
import { inflateRawSync, inflateSync } from "node:zlib";

/**
 * ASCII85 decoder.
 *
 * PDF writers (ReportLab among them) commonly stack filters as
 * `[/ASCII85Decode /FlateDecode]`, so a stream's raw bytes are base-85 text
 * that has to be unpacked before inflate will touch them. Skipping this step
 * makes every such file look empty — and therefore clean — to a privacy scan.
 */
export function ascii85(input) {
  let text = input.replace(/\s/g, "");
  if (text.startsWith("<~")) text = text.slice(2);
  const terminator = text.indexOf("~>");
  if (terminator !== -1) text = text.slice(0, terminator);

  const out = [];
  let group = [];
  for (const char of text) {
    if (char === "z" && group.length === 0) {
      out.push(0, 0, 0, 0);
      continue;
    }
    group.push(char.charCodeAt(0) - 33);
    if (group.length === 5) {
      let value = 0;
      for (const digit of group) value = value * 85 + digit;
      out.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
      group = [];
    }
  }
  if (group.length > 0) {
    const kept = group.length - 1;
    while (group.length < 5) group.push(84);
    let value = 0;
    for (const digit of group) value = value * 85 + digit;
    const bytes = [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
    for (let i = 0; i < kept; i += 1) out.push(bytes[i]);
  }
  return Buffer.from(out);
}

// Filter stacks a writer might have used, most common first. Order matters only
// for speed; each is tried until one yields bytes.
const DECODERS = [
  (bytes) => inflateSync(bytes),
  (bytes) => inflateRawSync(bytes),
  (bytes) => inflateSync(ascii85(bytes.toString("latin1"))),
  (bytes) => inflateRawSync(ascii85(bytes.toString("latin1"))),
  (bytes) => ascii85(bytes.toString("latin1")),
];

/** UTF-16BE hex (`0041` → `A`) used as ToUnicode destinations. */
export function utf16BeHex(hex) {
  const bytes = Buffer.from(hex, "hex");
  let out = "";
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = (bytes[i] << 8) | bytes[i + 1];
    if (code) out += String.fromCharCode(code);
  }
  return out;
}

/**
 * Parse every ToUnicode CMap in decoded PDF text into code→string maps.
 *
 * LibreOffice (and other CID writers) put glyph ids in `<aa><bb>…` Tj operands
 * instead of literal ASCII. Without these maps a privacy scan only sees hex.
 */
export function parseToUnicodeMaps(text) {
  const maps = [];
  const cmaps = text.matchAll(/begincmap[\s\S]*?endcmap/g);
  for (const [cmap] of cmaps) {
    const map = new Map();
    for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
      for (const pair of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
        map.set(pair[1].toLowerCase(), utf16BeHex(pair[2]));
      }
    }
    for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
      for (const range of block[1].matchAll(
        /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g,
      )) {
        const start = Number.parseInt(range[1], 16);
        const end = Number.parseInt(range[2], 16);
        const width = range[1].length;
        let dest = Number.parseInt(range[3], 16);
        for (let code = start; code <= end; code += 1, dest += 1) {
          map.set(code.toString(16).padStart(width, "0"), utf16BeHex(dest.toString(16).padStart(4, "0")));
        }
      }
      for (const range of block[1].matchAll(
        /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([^\]]*)\]/g,
      )) {
        const start = Number.parseInt(range[1], 16);
        const width = range[1].length;
        const dests = [...range[3].matchAll(/<([0-9A-Fa-f]+)>/g)].map((m) => m[1]);
        dests.forEach((dest, i) => {
          map.set((start + i).toString(16).padStart(width, "0"), utf16BeHex(dest));
        });
      }
    }
    if (map.size > 0) maps.push(map);
  }
  return maps;
}

/** Decode one `<hex>` Tj operand through a single ToUnicode map. */
export function decodeMappedHex(hex, map) {
  const src = hex.toLowerCase();
  let out = "";
  let i = 0;
  while (i < src.length) {
    let matched = false;
    for (let width = Math.min(4, src.length - i); width >= 2; width -= 2) {
      const key = src.slice(i, i + width);
      if (map.has(key)) {
        out += map.get(key);
        i += width;
        matched = true;
        break;
      }
    }
    if (!matched) i += 2;
  }
  return out;
}

/**
 * Expand custom-encoded Tj/TJ hex strings using every ToUnicode map found.
 *
 * Fonts reuse low glyph ids, so each map is applied across every operand in
 * document order and the results are concatenated. The matching font yields
 * contiguous strings (e.g. `developer@marcfors.com`); the others add noise
 * the privacy scan can ignore.
 */
export function expandMappedStrings(text, maps = parseToUnicodeMaps(text)) {
  if (maps.length === 0) return "";
  const operands = [];
  for (const match of text.matchAll(/<([0-9A-Fa-f]+)>\s*Tj|\[(.*?)\]\s*TJ/gs)) {
    if (match[1]) {
      operands.push(match[1]);
      continue;
    }
    for (const hex of match[2].matchAll(/<([0-9A-Fa-f]+)>/g)) {
      operands.push(hex[1]);
    }
  }
  if (operands.length === 0) return "";
  return maps
    .map((map) => operands.map((hex) => decodeMappedHex(hex, map)).join(""))
    .join("\n");
}

/**
 * Recover the searchable text of a PDF: the raw file bytes plus every stream
 * decoded, plus ToUnicode-mapped Tj/TJ operands. This is not a faithful text
 * extraction — glyph positioning is ignored — it only has to surface literal
 * strings well enough for a substring/regex scan to find them.
 */
export function pdfText(file) {
  const buf = readFileSync(file);
  const raw = buf.toString("latin1");
  let text = raw;

  const objects = /(\d+)\s+(\d+)\s+obj\b/g;
  let match;
  while ((match = objects.exec(raw)) !== null) {
    const bodyStart = match.index + match[0].length;
    const end = raw.indexOf("endobj", bodyStart);
    if (end === -1) continue;
    const streamAt = raw.indexOf("stream", bodyStart);
    if (streamAt === -1 || streamAt > end) continue;

    let start = streamAt + "stream".length;
    if (buf[start] === 0x0d) start += 1;
    if (buf[start] === 0x0a) start += 1;
    const streamEnd = raw.indexOf("endstream", start);
    if (streamEnd === -1) continue;

    const data = buf.subarray(start, streamEnd);
    for (const decode of DECODERS) {
      try {
        const decoded = decode(data).toString("latin1");
        if (decoded) {
          text += decoded;
          break;
        }
      } catch {
        // not this filter stack — try the next
      }
    }
  }
  return text + expandMappedStrings(text);
}
