/**
 * Runs production `npm audit` without inheriting a poisoned
 * `npm_config_allow_scripts` from the parent `npm run` env (user ~/.npmrc
 * `allow-scripts=…` becomes an env/CLI policy and npm 11 rejects it for
 * project-scoped audit). Package policy stays in package.json#allowScripts.
 */
import { execFileSync } from "node:child_process";

const env = { ...process.env };
delete env.npm_config_allow_scripts;

execFileSync("npm", ["audit", "--omit=dev", "--audit-level=high"], {
  stdio: "inherit",
  env,
});
