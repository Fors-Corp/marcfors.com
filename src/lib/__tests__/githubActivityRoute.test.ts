import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/github-activity/route";
import { fetchGitHubActivity } from "@/lib/githubActivity";

vi.mock("@/lib/githubActivity", () => ({ fetchGitHubActivity: vi.fn() }));
afterEach(() => vi.clearAllMocks());

describe("GitHub activity endpoint", () => {
  it.each([
    { events: [], calendar: [], status: 200, cache: "public, max-age=0, s-maxage=300" },
    { events: null, calendar: [], status: 200, cache: "no-store" },
    { events: [], calendar: null, status: 200, cache: "no-store" },
    { events: null, calendar: null, status: 503, cache: "no-store" },
  ])("handles independent upstream availability (%#)", async ({ events, calendar, status, cache }) => {
    const snapshot = { events, calendar, checkedAt: "2026-10-16T12:00:00Z" };
    vi.mocked(fetchGitHubActivity).mockResolvedValue(snapshot);
    const response = await GET();
    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe(cache);
    expect(await response.json()).toEqual(snapshot);
  });
});
