import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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

const automerge = parse(
  fs.readFileSync(
    new URL("../../../.github/workflows/dependabot-automerge.yml", import.meta.url),
    "utf8",
  ),
);
const automergeJob = automerge.jobs.automerge;
const mergeStep = automergeJob.steps.find(
  (step: { name?: string }) => step.name === "Wait for CI to pass, then merge",
);

// Stand-in for the GitHub CLI on a runner with no checkout: any call that does
// not name the repo with --repo fails exactly like the real gh did on #105.
const ghStub = `gh() {
  printf 'gh %s\\n' "$*" >> "$GH_LOG"
  case " $* " in
    *" --repo test-owner/test-repo "*) ;;
    *) echo "failed to determine base repo: fatal: not a git repository" >&2; return 1 ;;
  esac
  case "$1 $2" in
    "run list") printf '%s\\n' "$CI_STATE" ;;
  esac
}
sleep() { :; }
`;

function runMergeStep(ciState: string) {
  const log = `${fs.mkdtempSync(path.join(os.tmpdir(), "automerge-"))}/gh.log`;
  fs.writeFileSync(log, "");
  const result = spawnSync("bash", ["-e", "-o", "pipefail", "-c", `${ghStub}${mergeStep.run}`], {
    encoding: "utf8",
    env: {
      ...process.env,
      GH_LOG: log,
      CI_STATE: ciState,
      GH_REPO: "test-owner/test-repo",
      PR_NUMBER: "105",
      HEAD_REF: "dependabot/npm_and_yarn/example-1.0.1",
      HEAD_SHA: "f0dbd53",
    },
  });
  return { ...result, calls: fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean) };
}

describe("Dependabot auto-merge", () => {
  it("names the repo for gh, because the job has no checkout", () => {
    expect(automergeJob.env.GH_REPO).toBe("${{ github.repository }}");
    expect(
      automergeJob.steps.some((step: { uses?: string }) => step.uses?.startsWith("actions/checkout")),
    ).toBe(false);
    expect(mergeStep.run).toMatch(/gh run list --repo "\$GH_REPO"/);
    expect(mergeStep.run).toMatch(/gh pr merge "\$PR_NUMBER" --repo "\$GH_REPO"/);
  });

  it("never approves and never uses native auto-merge", () => {
    for (const step of automergeJob.steps) {
      expect(step.run ?? "").not.toMatch(/gh pr review/);
      expect(step.run ?? "").not.toMatch(/--auto\b/);
    }
  });

  it("merges once the CI run for the head SHA is green", () => {
    const result = runMergeStep("completed/success");
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    expect(result.calls).toHaveLength(2);
    expect(result.calls[0]).toMatch(/^gh run list --repo test-owner\/test-repo --branch \S+ --workflow CI /);
    expect(result.calls[1]).toBe(
      "gh pr merge 105 --repo test-owner/test-repo --squash --delete-branch",
    );
  });

  it("leaves the PR open when CI fails", () => {
    const result = runMergeStep("completed/failure");
    expect(result.status).toBe(1);
    expect(result.calls.some((call) => call.startsWith("gh pr merge"))).toBe(false);
  });

  it("keeps polling while CI is still running, then times out without merging", () => {
    const result = runMergeStep("in_progress/");
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Timed out waiting for the CI run to finish.");
    expect(result.calls).toHaveLength(60);
    expect(result.calls.every((call) => call.startsWith("gh run list"))).toBe(true);
  });
});
