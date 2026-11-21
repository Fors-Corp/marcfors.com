#!/usr/bin/env node
/**
 * Installs repo git hooks from scripts/git-hooks/ into the real hooks directory
 * (`.git/hooks`, or whatever `core.hooksPath` / Cursor’s original path is).
 *
 * Cursor Cloud remaps `core.hooksPath` to a dispatcher that only runs hook
 * names symlinked to `.dispatcher`. When that layout is detected we also
 * ensure a `pre-push` → `.dispatcher` link exists so `.git/hooks/pre-push`
 * (listed in `.cursor-original-hooks-path`) actually runs on push.
 */
import {
  copyFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  symlinkSync,
  lstatSync,
} from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(root, "scripts", "git-hooks");
const gitDir = path.join(root, ".git");

if (!existsSync(gitDir) || !existsSync(sourceDir)) {
  process.exit(0);
}

function resolveHooksDir() {
  try {
    const resolved = execSync("git rev-parse --git-path hooks", {
      cwd: root,
      encoding: "utf8",
    }).trim();
    return path.resolve(root, resolved);
  } catch {
    return path.join(gitDir, "hooks");
  }
}

/** Prefer Cursor’s recorded original path, else `.git/hooks`. */
function resolveOriginalHooksDir(activeHooksDir) {
  const marker = path.join(activeHooksDir, ".cursor-original-hooks-path");
  if (existsSync(marker)) {
    const recorded = readFileSync(marker, "utf8").trim();
    if (recorded) return path.resolve(recorded);
  }
  return path.join(gitDir, "hooks");
}

function installInto(hooksDir) {
  mkdirSync(hooksDir, { recursive: true });
  for (const name of readdirSync(sourceDir)) {
    if (name.startsWith(".")) continue;
    const from = path.join(sourceDir, name);
    const to = path.join(hooksDir, name);
    copyFileSync(from, to);
    chmodSync(to, 0o755);
    console.log(`installed git hook: ${path.relative(root, to)}`);
  }
}

const activeHooksDir = resolveHooksDir();
const originalHooksDir = resolveOriginalHooksDir(activeHooksDir);

// Always land the repo hook where the Cursor dispatcher (or plain git) will
// execute user hooks from.
installInto(originalHooksDir);

// Plain git with default hooksPath: original === active; done.
// Cursor dispatcher: also ensure `pre-push` is wired into the active dir.
if (path.resolve(activeHooksDir) !== path.resolve(originalHooksDir)) {
  const dispatcher = path.join(activeHooksDir, ".dispatcher");
  const prePushLink = path.join(activeHooksDir, "pre-push");
  if (existsSync(dispatcher) && !existsSync(prePushLink)) {
    symlinkSync(".dispatcher", prePushLink);
    console.log(`linked Cursor dispatcher pre-push → .dispatcher (${prePushLink})`);
  } else if (existsSync(prePushLink)) {
    try {
      const st = lstatSync(prePushLink);
      if (!st.isSymbolicLink() && !st.isFile()) {
        /* leave exotic entries alone */
      }
    } catch {
      /* ignore */
    }
  }
}
