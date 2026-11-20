#!/usr/bin/env node
/**
 * Local / pre-push gate: production build + LHCI desktop + LHCI mobile.
 * Asserts categories:performance minScore 1 (see lighthouserc*.cjs).
 *
 * Escape hatches:
 *   SKIP_LIGHTHOUSE=1   — skip entirely (print a warning)
 *   git push --no-verify — bypass the pre-push hook
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(label, command, args) {
  console.log(`\n▸ ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? "null"}).`);
    process.exit(result.status ?? 1);
  }
}

if (process.env.SKIP_LIGHTHOUSE === "1") {
  console.warn("SKIP_LIGHTHOUSE=1 — skipping desktop/mobile Lighthouse Perf 100 gate.");
  process.exit(0);
}

if (!existsSync(path.join(root, ".next"))) {
  run("production build (missing .next)", "npm", ["run", "build"]);
} else {
  // Always rebuild so the gate measures this working tree, not a stale artifact.
  run("production build", "npm", ["run", "build"]);
}

const lhci = ["--yes", "@lhci/cli@0.15.1", "autorun"];
run("Lighthouse desktop (Perf ≥ 100)", "npx", [...lhci, "--config=lighthouserc.cjs"]);
run("Lighthouse mobile (Perf ≥ 100)", "npx", [
  ...lhci,
  "--config=lighthouserc.mobile.cjs",
]);

console.log("\n✓ Desktop + mobile Lighthouse Performance gated at 100.\n");
