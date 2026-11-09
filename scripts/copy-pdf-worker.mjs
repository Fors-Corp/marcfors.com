#!/usr/bin/env node
/**
 * Ships the pdf.js worker next to the CV page so the client viewer can load it
 * same-origin under the site CSP (script-src / worker-src 'self').
 * Run from prebuild and postinstall so `next dev` and `next build` both see it.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destDir = join(root, "public");
const dest = join(destDir, "pdf.worker.min.mjs");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`copied pdf.worker.min.mjs → public/ (${src})`);
