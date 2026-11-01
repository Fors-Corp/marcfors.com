import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPublicRepos, isListedRepo, type GhRepo } from "@/lib/github";
import { skipRepos } from "@/data/projects";
import { GITHUB_ORG, GITHUB_USER } from "@/lib/site";

function repo(overrides: Partial<GhRepo> = {}): GhRepo {
  return {
    name: "some-lib",
    html_url: "https://github.com/x/some-lib",
    description: "a thing",
    language: "TypeScript",
    stargazers_count: 0,
    homepage: "https://some-lib.vercel.app",
    pushed_at: "2026-01-01T00:00:00Z",
    fork: false,
    ...overrides,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("isListedRepo", () => {
  it("keeps a non-fork, homepage-having repo that has a description or a language", () => {
    expect(isListedRepo(repo())).toBe(true);
    expect(isListedRepo(repo({ description: null }))).toBe(true); // still has language
  });

  it("drops forks, skip-listed names, empty shells, and repos with nothing live", () => {
    expect(isListedRepo(repo({ fork: true }))).toBe(false);
    const skipped = [...skipRepos][0];
    expect(skipped, "skip list is populated").toBeTruthy();
    expect(isListedRepo(repo({ name: skipped }))).toBe(false);
    expect(isListedRepo(repo({ description: null, language: null }))).toBe(false);
    expect(isListedRepo(repo({ homepage: null }))).toBe(false);
    expect(isListedRepo(repo({ homepage: "" }))).toBe(false);
  });
});

describe("fetchPublicRepos", () => {
  it("requests user and org repos, merges them, and returns the filtered list", async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const rows = String(url).includes(`/orgs/${GITHUB_ORG}/`)
        ? [repo({ name: "org-keep", html_url: "https://github.com/Fors-Corp/org-keep" })]
        : [
            repo({ name: "keep-me", html_url: "https://github.com/marcfs31/keep-me" }),
            repo({ name: "a-fork", fork: true, html_url: "https://github.com/marcfs31/a-fork" }),
          ];
      return { ok: true, json: async () => rows };
    });
    vi.stubGlobal("fetch", fetchMock);

    const rows = await fetchPublicRepos();
    expect(rows.map((r) => r.name).sort()).toEqual(["keep-me", "org-keep"]);
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes(`/users/${GITHUB_USER}/repos`))).toBe(true);
    expect(urls.some((url) => url.includes(`/orgs/${GITHUB_ORG}/repos`))).toBe(true);
  });

  it("dedupes the same html_url across user and org responses", async () => {
    const shared = repo({
      name: "marcfors.com",
      html_url: "https://github.com/Fors-Corp/marcfors.com",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [shared] }),
    );
    const rows = await fetchPublicRepos();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.html_url).toBe(shared.html_url);
  });

  it("returns an empty list and logs when both sources are non-ok", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }));
    expect(await fetchPublicRepos()).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"status":403'));
    warn.mockRestore();
  });

  it("returns an empty list when the request throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await fetchPublicRepos()).toEqual([]);
    vi.restoreAllMocks();
  });

  it("sends a bearer token when GITHUB_TOKEN is set", async () => {
    vi.stubEnv("GITHUB_TOKEN", "ghp_test");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);
    await fetchPublicRepos();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer ghp_test");
    vi.unstubAllEnvs();
  });
});
