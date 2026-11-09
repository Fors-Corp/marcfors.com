/**
 * Offline smoke: representative Ask questions must be answerable from the
 * indexed CV extract (no Neon / Anthropic). Mirrors what retrieve should find
 * after npm run rag:seed.
 */
import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { splitText } from "./chunk.js";
import { loadCvExtract } from "./extractCv.js";
import { contextCoversQuestion } from "../../src/lib/rag/lexical.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const QUESTIONS: Array<{ q: string; must: RegExp }> = [
  { q: "What roles has Marc held?", must: /Fors Corp|Dynatrace|CREALOGIX|T-Systems/i },
  { q: "What skills does Marc list on his CV?", must: /React|TypeScript|Claude Code|MCP/i },
  { q: "What languages does Marc speak?", must: /Italian \(intermediate\)|Catalan \(native\)/i },
  { q: "Is Marc open to remote roles?", must: /Open to remote roles/i },
  { q: "What does the CV say about Embedded RAG?", must: /Embedded RAG/i },
  { q: "Where can I find Wordkeep on the CV?", must: /Wordkeep/i },
  { q: "What is Marc's email?", must: /developer@marcfors\.com/ },
];

describe("CV extract covers representative Ask queries", () => {
  it("keeps roles, skills, languages, availability, and project links", async () => {
    const cv = await loadCvExtract(root);
    const parts = splitText(cv.text, 800, 120);
    const blob = parts.join("\n\n");

    for (const { q, must } of QUESTIONS) {
      expect(blob, q).toMatch(must);
      expect(contextCoversQuestion(blob, q), q).toBe(true);
    }

    expect(blob).not.toMatch(/\+34\b/);
    expect(blob).not.toMatch(/Phone:/i);
  });
});
