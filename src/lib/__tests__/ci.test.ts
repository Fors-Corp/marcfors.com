import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const workflow = parse(
  fs.readFileSync(new URL("../../../.github/workflows/ci.yml", import.meta.url), "utf8"),
);
const steps = workflow.jobs.verify.steps;
const authorCheck = steps.find(
  (step: { name?: string }) => step.name === "Author uses the developer mailbox",
);

describe("CI author check", () => {
  it("fetches the PR head while keeping the merge checkout for verification", () => {
    expect(steps[0].with["fetch-depth"]).toBe(2);
    expect(steps[0].with.ref).toBeUndefined();
    expect(steps[0].with["persist-credentials"]).toBe(false);
    expect(authorCheck.env.PR_HEAD_SHA).toBe("${{ github.event.pull_request.head.sha }}");
  });

  it("exempts Dependabot by PR owner rather than the rerun actor", () => {
    expect(authorCheck.if).toBe(
      "github.event_name == 'pull_request' && github.event.pull_request.user.login != 'dependabot[bot]'",
    );
  });

  it.each([
    ["developer@marcfors.com", 0],
    ["198982749+Copilot@users.noreply.github.com", 0],
    ["other@example.com", 1],
    ["someone@users.noreply.github.com", 1],
    ["Copilot@users.noreply.github.com", 1],
    ["", 1],
  ])("validates PR-head author %j", (author, status) => {
    const result = spawnSync(
      "bash",
      ["-e", "-c", `git() { printf '%s\\n' "$*" >&2; printf '%s\\n' "$TEST_AUTHOR"; }\n${authorCheck.run}`],
      {
        encoding: "utf8",
        env: { ...process.env, PR_HEAD_SHA: "test-pr-head", TEST_AUTHOR: author },
      },
    );
    expect(result.status).toBe(status);
    expect(result.stderr.trim()).toBe("log -1 --format=%ae test-pr-head --");
  });

  it("fails closed when the PR head cannot be read", () => {
    const result = spawnSync("bash", ["-e", "-c", `git() { return 128; }\n${authorCheck.run}`], {
      env: { ...process.env, PR_HEAD_SHA: "missing-pr-head" },
    });
    expect(result.status).toBe(128);
  });
});
