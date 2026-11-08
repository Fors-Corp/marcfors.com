import { describe, expect, it } from "vitest";
import {
  activityClause,
  CV_ACTIVITY_RE,
  formatCount,
  isoDaysAgo,
  parseContributionCalendar,
  replaceActivityClause,
  sumTrailingYear,
} from "./cvStats.mjs";

describe("cvStats", () => {
  it("formats thousands for the CV clause", () => {
    expect(formatCount(4507)).toBe("4,507");
    expect(activityClause({
      contributions: 4515,
      pullRequests: 77,
      merged: 77,
      repositories: 8,
    })).toBe(
      "4,515 GitHub contributions in the past year; 77 pull requests (77 merged) across 8 repositories in the last 30 days.",
    );
  });

  it("replaces the activity clause once", () => {
    const before =
      "workflow: 4,507 GitHub contributions in the past year; 186 pull requests (180 merged) across 17 repositories in the last 30 days. Next.";
    const after = replaceActivityClause(before, {
      contributions: 4515,
      pullRequests: 77,
      merged: 77,
      repositories: 8,
    });
    expect(after).toContain("4,515 GitHub contributions");
    expect(after).toContain("77 pull requests (77 merged) across 8 repositories");
    expect(CV_ACTIVITY_RE.test(after)).toBe(true);
  });

  it("sums the trailing year from a calendar", () => {
    const start = new Date(Date.UTC(2025, 0, 1));
    const days = Array.from({ length: 365 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      return { date: d.toISOString().slice(0, 10), level: 1, count: i === 364 ? 5 : 1 };
    });
    expect(sumTrailingYear(days, new Date(Date.UTC(2025, 11, 31)))).toBe(364 + 5);
  });

  it("parses a minimal valid calendar fragment shape", () => {
    // Build 365 consecutive days so the completeness check passes.
    const start = Date.UTC(2025, 0, 1);
    let tips = "";
    let cells = "";
    for (let i = 0; i < 365; i += 1) {
      const date = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
      const id = `day-t${i}`;
      tips += `<tool-tip for="${id}">${i === 0 ? "No" : "2"} contributions</tool-tip>`;
      cells += `<td id="${id}" data-date="${date}" data-level="1"></td>`;
    }
    const days = parseContributionCalendar(tips + cells);
    expect(days).toHaveLength(365);
    expect(days[0].count).toBe(0);
    expect(days[1].count).toBe(2);
  });

  it("isoDaysAgo is UTC date-stable", () => {
    expect(isoDaysAgo(30, new Date("2026-11-08T15:00:00Z"))).toBe("2026-10-09");
  });
});
