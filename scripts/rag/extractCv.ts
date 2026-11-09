/**
 * Extract readable CV text for Ask RAG seeding.
 *
 * Uses mammoth (DOCX) or pdf-parse + @napi-rs/canvas (PDF) — never
 * scripts/lib/pdf.mjs (privacy-scan only; too noisy for chunking).
 *
 * Policy: index one published CV under source_path `cv/marc-fors-cv.pdf`.
 * Prefer DOCX (cleaner section breaks) when the sibling editing source exists;
 * fall back to the public PDF. Strip phone lines before seed.
 */
import "@napi-rs/canvas";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import mammoth from "mammoth";
import { CanvasFactory } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

/** Stable citation path — matches the public download name. */
export const CV_SOURCE_PATH = "cv/marc-fors-cv.pdf";

export const CV_ASSET = {
  pdfPublic: "public/marc-fors-cv.pdf",
  pdfDocs: "docs/cv/Marc_Fors_CV_AI.pdf",
  docx: "docs/cv/Marc_Fors_CV_AI.docx",
} as const;

const SECTION_HEADINGS = [
  "PROFESSIONAL SUMMARY",
  "PROFESSIONAL EXPERIENCE",
  "PROJECTS",
  "SKILLS",
  "EDUCATION",
] as const;

export type CvExtract = {
  sourcePath: string;
  filename: string;
  language: string;
  extractMethod: "docx" | "pdf";
  extractedFrom: string;
  text: string;
};

/** Remove phone lines so Ask never surfaces a number absent from the site. */
export function stripPhoneLines(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => {
      if (/^\s*Phone\s*:/i.test(line)) return false;
      if (/\+\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\s?\d{2}/.test(line)) return false;
      if (/\+34\b/.test(line)) return false;
      return true;
    })
    .join("\n");
}

/** Turn ALL-CAPS CV section labels into markdown headings for cleaner splits. */
export function normalizeCvHeadings(text: string): string {
  let out = text.replace(/\r\n/g, "\n");
  for (const heading of SECTION_HEADINGS) {
    const re = new RegExp(`(^|\\n)\\s*${heading}\\s*(?=\\n|$)`, "gi");
    out = out.replace(re, `$1\n## ${heading}\n`);
  }
  // Promote the Languages line under Skills into its own heading.
  out = out.replace(/(^|\n)\s*Languages:\s*/i, "$1\n## LANGUAGES\nLanguages: ");
  return out
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer, CanvasFactory });
  try {
    const result = await parser.getText();
    return String(result.text || "").trim();
  } finally {
    await parser.destroy();
  }
}

export async function extractDocxText(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return String(result.value || "").trim();
}

/**
 * Load the single CV document to seed.
 * Prefers docs DOCX when present; otherwise public PDF, then docs PDF.
 */
export async function loadCvExtract(root: string): Promise<CvExtract> {
  const docxAbs = path.join(root, CV_ASSET.docx);
  const pdfPublicAbs = path.join(root, CV_ASSET.pdfPublic);
  const pdfDocsAbs = path.join(root, CV_ASSET.pdfDocs);

  let raw = "";
  let extractMethod: "docx" | "pdf" = "pdf";
  let extractedFrom = "";

  if (existsSync(docxAbs)) {
    raw = await extractDocxText(docxAbs);
    extractMethod = "docx";
    extractedFrom = docxAbs;
  } else if (existsSync(pdfPublicAbs)) {
    raw = await extractPdfText(readFileSync(pdfPublicAbs));
    extractMethod = "pdf";
    extractedFrom = pdfPublicAbs;
  } else if (existsSync(pdfDocsAbs)) {
    raw = await extractPdfText(readFileSync(pdfDocsAbs));
    extractMethod = "pdf";
    extractedFrom = pdfDocsAbs;
  } else {
    throw new Error(
      "CV asset missing: expected docs/cv/Marc_Fors_CV_AI.docx or public/marc-fors-cv.pdf",
    );
  }

  const cleaned = normalizeCvHeadings(stripPhoneLines(raw));
  if (cleaned.length < 200) {
    throw new Error(
      `no extractable text from CV (${path.relative(root, extractedFrom) || extractedFrom})`,
    );
  }

  const preamble = [
    "---",
    "source_type: cv",
    "filename: marc-fors-cv.pdf",
    "language: en",
    "authority: primary",
    `extract_method: ${extractMethod}`,
    "---",
    "",
    "# Marc Fors — curriculum vitae",
    "",
    "Published CV text. When this conflicts with thinner homepage corpus copy, prefer these facts.",
    "",
  ].join("\n");

  return {
    sourcePath: CV_SOURCE_PATH,
    filename: "marc-fors-cv.pdf",
    language: "en",
    extractMethod,
    extractedFrom,
    text: `${preamble}${cleaned}\n`,
  };
}
