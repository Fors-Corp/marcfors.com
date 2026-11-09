import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { splitText } from "./chunk.js";
import {
  CV_SOURCE_PATH,
  extractPdfText,
  loadCvExtract,
  normalizeCvHeadings,
  stripPhoneLines,
} from "./extractCv.js";
import { readFileSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("CV extract for Ask seed", () => {
  it("strips phone lines before indexing", () => {
    const raw = [
      "Email: developer@marcfors.com",
      "Phone: +34 600 00 00 00",
      "Open to remote roles.",
    ].join("\n");
    const cleaned = stripPhoneLines(raw);
    expect(cleaned).toContain("developer@marcfors.com");
    expect(cleaned).toContain("Open to remote roles");
    expect(cleaned).not.toMatch(/\+34/);
    expect(cleaned).not.toMatch(/Phone:/i);
  });

  it("normalizes CV section headings for 800/120 splits", () => {
    const text = normalizeCvHeadings(
      ["Marc Fors", "PROFESSIONAL SUMMARY", "Summary body.", "SKILLS", "React", "Languages: Spanish"].join(
        "\n",
      ),
    );
    expect(text).toContain("## PROFESSIONAL SUMMARY");
    expect(text).toContain("## SKILLS");
    expect(text).toContain("## LANGUAGES");
  });

  it("extracts readable text from the published PDF via pdf-parse", async () => {
    const buf = readFileSync(path.join(root, "public/marc-fors-cv.pdf"));
    const text = await extractPdfText(buf);
    expect(text.length).toBeGreaterThan(2000);
    expect(text).toContain("developer@marcfors.com");
    expect(text).toContain("Embedded RAG");
    expect(text).toMatch(/Open to remote roles/i);
    expect(text).toMatch(/Italian \(intermediate\)/);
    expect(text).not.toMatch(/\+34\b/);
  });

  it("loads one CV document under cv/marc-fors-cv.pdf with DOCX preferred", async () => {
    const cv = await loadCvExtract(root);
    expect(cv.sourcePath).toBe(CV_SOURCE_PATH);
    expect(cv.extractMethod).toBe("docx");
    expect(cv.text).toContain("source_type: cv");
    expect(cv.text).toContain("authority: primary");
    expect(cv.text).toContain("developer@marcfors.com");
    expect(cv.text).toContain("Embedded RAG");
    expect(cv.text).toMatch(/Italian \(intermediate\)/);
    expect(cv.text).toMatch(/Open to remote roles/i);
    expect(cv.text).toMatch(/Wordkeep/);
    expect(cv.text).not.toMatch(/\+34\b/);
    expect(cv.text).not.toMatch(/Phone:/i);

    const parts = splitText(cv.text, 800, 120);
    expect(parts.length).toBeGreaterThanOrEqual(4);
    expect(parts.length).toBeLessThanOrEqual(12);
    expect(parts.every((p) => p.length > 0)).toBe(true);
  });
});
