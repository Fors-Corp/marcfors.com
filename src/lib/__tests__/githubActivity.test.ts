import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGitHubActivity, parseContributionCalendar, parsePublicEvents } from "@/lib/githubActivity";
import { GITHUB_USER } from "@/lib/site";

function event(type = "PushEvent", payload: Record<string, unknown> = {}) {
  return {
    id: "123", type, public: true, actor: { login: GITHUB_USER },
    repo: { name: "Fors-Corp/marcfors.com" },
    created_at: "2026-10-16T12:00:00Z", payload,
  };
}

function calendar(count = 364) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(2025, 9, 19 + i)).toISOString().slice(0, 10);
    return `<td id="day-${i}" data-date="${date}" data-level="${i % 5}"></td>
      <tool-tip for="day-${i}">${i === 0 ? "No" : i === 1 ? "1,234" : "2"} contributions on a date.</tool-tip>`;
  }).join("");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("public event normalization", () => {
  it("supports pushes even when GitHub omits commit counts/messages", () => {
    const [row] = parsePublicEvents([event("PushEvent", { head: "a".repeat(40), message: "not rendered" })]);
    expect(row).toEqual({
      id: "123", kind: "push", repo: "Fors-Corp/marcfors.com",
      date: "2026-10-16T12:00:00Z",
      url: `https://github.com/Fors-Corp/marcfors.com/commit/${"a".repeat(40)}`,
    });
    expect(parsePublicEvents([event()])[0].url).toMatch(/\/commits$/);
  });

  it("constructs safe PR, issue and release links rather than trusting upstream URLs", () => {
    const rows = parsePublicEvents([
      event("PullRequestEvent", { pull_request: { number: 42, html_url: "javascript:bad" } }),
      event("IssuesEvent", { issue: { number: 2 } }),
      event("ReleaseEvent", { action: "published" }),
    ]);
    expect(rows.map((row) => row.kind)).toEqual(["pullRequest", "issue", "release"]);
    expect(rows.map((row) => row.url)).toEqual([
      "https://github.com/Fors-Corp/marcfors.com/pull/42",
      "https://github.com/Fors-Corp/marcfors.com/issues/2",
      "https://github.com/Fors-Corp/marcfors.com/releases",
    ]);
  });

  it("rejects private, unrelated, malformed and unsupported events", () => {
    expect(parsePublicEvents([
      { ...event(), public: false }, { ...event(), actor: { login: "someone-else" } },
      { ...event(), repo: { name: "https://bad.test/repo" } }, { ...event(), id: 12 },
      { ...event(), created_at: "invalid" }, null, {},
      event("DeleteEvent"), event("ReleaseEvent", { action: "created" }),
      event("PullRequestEvent", { pull_request: { number: -1 } }),
      event("IssuesEvent", { issue: { number: "2" } }),
    ])).toEqual([]);
    expect(() => parsePublicEvents({ message: "rate limit" })).toThrow();
  });

  it("sorts newest first and bounds the public feed to six entries", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      ...event(), id: `${i}`, created_at: `2026-10-${String(i + 1).padStart(2, "0")}T12:00:00Z`,
    }));
    expect(parsePublicEvents(rows).map((row) => row.id)).toEqual(["9", "8", "7", "6", "5", "4"]);
  });
});

describe("public contribution calendar", () => {
  it("extracts only sorted date/count/intensity data and handles comma-separated counts", () => {
    const days = parseContributionCalendar(calendar());
    expect(days).toHaveLength(364);
    expect(days[0]).toEqual({ date: "2025-10-19", count: 0, level: 0 });
    expect(days[1].count).toBe(1234);
    expect(Object.keys(days[1])).toEqual(["date", "level", "count"]);
  });

  it.each([
    "", calendar(10), calendar(379),
    calendar().replace('data-date="2025-10-19"', 'data-date="invalid"'),
    calendar().replace('data-date="2025-10-19"', 'data-date="2025-02-30"'),
    calendar().replace('data-date="2025-10-19"', 'data-date="2025-10-20"'),
    calendar().replace('data-level="0"', 'data-level="5"'),
    calendar().replace('for="day-0"', 'for="missing"'),
  ])("fails explicitly on a malformed or incomplete fragment (%#)", (html) => {
    expect(() => parseContributionCalendar(html)).toThrow(/GitHub contribution/);
  });
});

describe("server-side GitHub retrieval", () => {
  it("caches both sources, forwards no visitor data and never sends credentials to the calendar", async () => {
    vi.stubEnv("GITHUB_TOKEN", "test-only-token");
    const fetchMock = vi.fn(async (url: string) => new URL(url).hostname === "api.github.com"
      ? Response.json([event()]) : new Response(calendar()));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchGitHubActivity();
    expect(result.events).toHaveLength(1);
    expect(result.calendar).toHaveLength(364);
    expect(Number.isFinite(Date.parse(result.checkedAt))).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/events/public?"), expect.objectContaining({
      cache: "force-cache", next: { revalidate: 300 },
      headers: { Accept: "application/vnd.github+json", "Accept-Language": "en", Authorization: "Bearer test-only-token" },
    }));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/contributions"), expect.objectContaining({
      headers: { Accept: "text/html", "Accept-Language": "en" },
    }));
  });

  it("works without a token and keeps a healthy calendar when the API is rate-limited", async () => {
    vi.stubEnv("GITHUB_TOKEN", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new URL(url).hostname === "api.github.com"
      ? new Response("", { status: 403 }) : new Response(calendar())));
    const result = await fetchGitHubActivity();
    expect(result.events).toBeNull();
    expect(result.calendar).toHaveLength(364);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("HTTP 403"));
  });

  it("logs failed retrieval/parsing and returns explicit nulls, not invented empty data", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect(await fetchGitHubActivity()).toMatchObject({ events: null, calendar: null });
    expect(warn).toHaveBeenCalledTimes(2);
    vi.stubGlobal("fetch", vi.fn(async (url: string) => new URL(url).hostname === "api.github.com"
      ? Response.json({ error: true }) : new Response("<html>markup changed</html>")));
    expect(await fetchGitHubActivity()).toMatchObject({ events: null, calendar: null });
  });
});
