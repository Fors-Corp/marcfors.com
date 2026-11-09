/**
 * Smoke-print the CV extract used by rag:seed (no database).
 *
 *   npm run rag:extract-cv
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCvExtract } from "./extractCv.js";
import { splitText } from "./chunk.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const cv = await loadCvExtract(root);
const parts = splitText(cv.text, 800, 120);
console.log(
  JSON.stringify(
    {
      sourcePath: cv.sourcePath,
      extractMethod: cv.extractMethod,
      extractedFrom: path.relative(root, cv.extractedFrom),
      chars: cv.text.length,
      chunksAt800_120: parts.length,
      preview: cv.text.slice(0, 500),
    },
    null,
    2,
  ),
);
