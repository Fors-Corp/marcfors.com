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

/**
 * Recover the searchable text of a PDF: the raw file bytes plus every stream
 * decoded. This is not a faithful text extraction — glyph positioning and font
 * encodings are ignored — it only has to surface literal strings well enough
 * for a substring/regex scan to find them.
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
  return text;
}
