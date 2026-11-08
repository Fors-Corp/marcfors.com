/** Recursive character splitter aligned with Embedded RAG / LangChain defaults. */

const SEPARATORS = ["\n\n", "\n", ". ", " ", ""] as const;

function splitOnce(text: string, separator: string): string[] {
  if (!separator) {
    return text ? [text] : [];
  }
  return text.split(separator).filter((part) => part.length > 0);
}

function mergeSplits(
  splits: string[],
  separator: string,
  chunkSize: number,
  overlap: number,
): string[] {
  const docs: string[] = [];
  let current: string[] = [];
  let total = 0;
  const sepLen = separator.length;

  const flush = () => {
    const joined = current.join(separator).trim();
    if (joined) docs.push(joined);
  };

  for (const piece of splits) {
    const size = piece.length;
    if (total + size + (current.length ? sepLen : 0) > chunkSize) {
      if (current.length) {
        flush();
        while (
          total > overlap ||
          (total + size + (current.length ? sepLen : 0) > chunkSize && total > 0)
        ) {
          total -= current[0]!.length + (current.length > 1 ? sepLen : 0);
          current = current.slice(1);
        }
      }
    }
    current.push(piece);
    total += size + (current.length > 1 ? sepLen : 0);
  }
  if (current.length) flush();
  return docs;
}

function splitTextRecursive(
  text: string,
  separators: readonly string[],
  chunkSize: number,
  overlap: number,
): string[] {
  const [separator = "", ...rest] = separators.length ? separators : [""];
  const parts = splitOnce(text, separator);
  const good: string[] = [];
  for (const part of parts) {
    if (part.length <= chunkSize) {
      good.push(part);
    } else if (rest.length) {
      good.push(...splitTextRecursive(part, rest, chunkSize, overlap));
    } else {
      for (let i = 0; i < part.length; i += Math.max(chunkSize - overlap, 1)) {
        good.push(part.slice(i, i + chunkSize));
      }
    }
  }
  return mergeSplits(good, separator, chunkSize, overlap);
}

export function splitText(
  text: string,
  chunkSize = 800,
  overlap = 120,
): string[] {
  const cleaned = String(text || "").trim();
  if (!cleaned) return [];
  if (cleaned.length <= chunkSize) return [cleaned];
  return splitTextRecursive(cleaned, SEPARATORS, chunkSize, overlap);
}
