#!/usr/bin/env node
import { execFileSync } from "node:child_process";

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

if (failed) {
  process.exit(1);
}

console.log("Privacy scan clean.");
