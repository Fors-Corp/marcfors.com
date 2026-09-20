import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pdfText } from "./pdf.mjs";

/**
 * Patterns that must never reach a published asset.
 *
 * Source files are covered by the grep in check-privacy.mjs, but that pass uses
 * `-I` (skip binaries) and would miss a PDF anyway, since its text sits inside
 * compressed streams. Mirrors BANNED_PUBLIC_PATTERNS / BANNED_PHONE_PATTERNS in
 * src/lib/site.ts — AGENTS.md: "Never commit a personal Gmail address, a phone
 * number, or the old `.me` host."
 */
export const ASSET_PATTERNS = [
  { label: "gmail address", re: /[\w.+-]+@gmail\.com/i },
  { label: "old .me host", re: /marcfors\.me/i },
  { label: "phone number", re: /\+\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\s?\d{2}/ },
  { label: "phone number", re: /\+34\b/ },
];

/** Text of one published file, with PDF streams decoded. */
export function assetText(file) {
  return file.toLowerCase().endsWith(".pdf") ? pdfText(file) : readFileSync(file, "latin1");
}

/**
 * Walk a published directory and return one finding per pattern hit.
 * An empty array means clean; a missing directory is clean too.
 */
export function scanPublicAssets(dir = "public") {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const findings = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findings.push(...scanPublicAssets(full));
      continue;
    }
    const text = assetText(full);
    for (const { label, re } of ASSET_PATTERNS) {
      const hit = text.match(re);
      if (hit) findings.push({ file: full, label, match: hit[0] });
    }
  }
  return findings;
}
