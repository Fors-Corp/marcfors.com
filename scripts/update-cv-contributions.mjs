#!/usr/bin/env node
/**
 * Refresh the GitHub activity clause on the downloadable CV.
 *
 * Source of truth: docs/cv/Marc_Fors_CV_AI.docx (phone-free public copy).
 * Published asset: public/marc-fors-cv.pdf (regenerated via LibreOffice).
 *
 * Usage:
 *   node scripts/update-cv-contributions.mjs
 *   npm run cv:update
 *
 * Optional: GITHUB_TOKEN for Search API quota. LibreOffice (`soffice`) and
 * Python 3 are required.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { activityClause, fetchCvStats } from "./lib/cvStats.mjs";
import { scanPublicAssets } from "./lib/privacy.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCX = path.join(ROOT, "docs/cv/Marc_Fors_CV_AI.docx");
const DOCX_PDF = path.join(ROOT, "docs/cv/Marc_Fors_CV_AI.pdf");
const PUBLIC_PDF = path.join(ROOT, "public/marc-fors-cv.pdf");
const PATCH_PY = path.join(ROOT, "scripts/lib/patch-cv-docx.py");

function whichSoffice() {
  for (const bin of ["soffice", "libreoffice"]) {
    try {
      execFileSync("sh", ["-c", `command -v ${bin}`], { encoding: "utf8" });
      return bin;
    } catch {
      /* try next */
    }
  }
  throw new Error("LibreOffice (soffice) is required to rebuild the CV PDF");
}

function patchDocx(clause) {
  const out = execFileSync("python3", [PATCH_PY, DOCX, clause], { encoding: "utf8" }).trim();
  return out === "changed";
}

function rebuildPdf() {
  const dir = mkdtempSync(path.join(tmpdir(), "cv-export-"));
  try {
    execFileSync(
      whichSoffice(),
      ["--headless", "--convert-to", "pdf:writer_pdf_Export", "--outdir", dir, DOCX],
      { stdio: "inherit" },
    );
    const pdf = path.join(dir, "Marc_Fors_CV_AI.pdf");
    copyFileSync(pdf, DOCX_PDF);
    copyFileSync(pdf, PUBLIC_PDF);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function assertPrivacyClean() {
  const findings = scanPublicAssets(path.join(ROOT, "public"));
  if (findings.length) {
    for (const f of findings) {
      console.error(`Privacy leak: ${f.label} in ${f.file}: ${f.match}`);
    }
    process.exit(1);
  }
}

const stats = await fetchCvStats();
const clause = activityClause(stats);
console.log(JSON.stringify({ stats, clause }, null, 2));
const changed = patchDocx(clause);
console.log(changed ? `DOCX updated` : "DOCX already current");
rebuildPdf();
assertPrivacyClean();
console.log(`Wrote ${path.relative(ROOT, DOCX_PDF)} and ${path.relative(ROOT, PUBLIC_PDF)}`);
