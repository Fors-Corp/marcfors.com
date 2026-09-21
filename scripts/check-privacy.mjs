#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { scanPublicAssets } from "./lib/privacy.mjs";

const patterns = ["@gmail.com", "marcfors.me"];
const paths = [
  "src",
  "content",
  "README.md",
  "CHANGELOG.md",
  "package.json",
  "AGENTS.md",
  "GROK.md",
  "CLAUDE.md",
  ".grok",
];

let failed = false;
for (const pattern of patterns) {
  try {
    const out = execFileSync("grep", ["-RIn", "-E", pattern, ...paths], {
      encoding: "utf8",
    });
    if (out.trim()) {
      failed = true;
      console.error(`Privacy leak: pattern ${pattern} found:\n${out}`);
    }
  } catch (error) {
    const err = error;
    if (err && typeof err === "object" && "status" in err && err.status !== 1) {
      throw error;
    }
  }
}

// Published assets need their own pass: the grep above skips binaries (`-I`),
// and a PDF keeps its text inside compressed streams, so a leak in `public/`
// scans clean either way. See scripts/lib/privacy.mjs.
for (const { file, label, match } of scanPublicAssets()) {
  failed = true;
  console.error(`Privacy leak: ${label} found in published asset ${file}: ${match}`);
}

if (failed) {
  process.exit(1);
}

console.log("Privacy scan clean (source + published assets).");
