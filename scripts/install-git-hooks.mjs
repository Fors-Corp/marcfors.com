#!/usr/bin/env node
/**
 * Installs repo git hooks from scripts/git-hooks/ into .git/hooks/.
 * Invoked from `postinstall` so every `npm ci` / `npm install` wires pre-push.
 */
import { copyFileSync, chmodSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "scripts", "git-hooks");
const gitDir = path.join(root, ".git");
const hooksDir = path.join(gitDir, "hooks");

if (!existsSync(gitDir) || !existsSync(sourceDir)) {
  process.exit(0);
}

mkdirSync(hooksDir, { recursive: true });

for (const name of readdirSync(sourceDir)) {
  if (name.startsWith(".")) continue;
  const from = path.join(sourceDir, name);
  const to = path.join(hooksDir, name);
  copyFileSync(from, to);
  chmodSync(to, 0o755);
  console.log(`installed git hook: ${name}`);
}
