/**
 * List Ask seed documents: curated corpus markdown + one CV extract.
 * Kept free of embedding imports so unit tests stay light.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { loadCvExtract } from "./extractCv.js";

export type SeedDocument = {
  sourcePath: string;
  text: string;
};

async function listMarkdownFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(full, base)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (entry.name === "ATTRIBUTION") continue;
    if (!/\.(md|txt)$/i.test(entry.name)) continue;
    files.push(path.relative(base, full));
  }
  return files.sort();
}

export async function collectSeedDocuments(
  projectRoot: string,
): Promise<SeedDocument[]> {
  const dir = path.join(projectRoot, "corpus");
  const corpusStat = await stat(dir).catch(() => null);
  if (!corpusStat?.isDirectory()) {
    throw new Error(`corpus directory missing: ${dir}`);
  }

  const relativePaths = await listMarkdownFiles(dir);
  if (relativePaths.length === 0) {
    throw new Error("corpus/ has no .md/.txt files to seed");
  }

  const docs: SeedDocument[] = [];
  for (const relative of relativePaths) {
    const absolute = path.join(dir, relative);
    const text = await readFile(absolute, "utf8");
    docs.push({
      sourcePath: relative.split(path.sep).join("/"),
      text,
    });
  }

  const cv = await loadCvExtract(projectRoot);
  docs.push({ sourcePath: cv.sourcePath, text: cv.text });
  return docs;
}
