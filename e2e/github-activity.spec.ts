import { expect, test } from "@playwright/test";

const calendar = Array.from({ length: 364 }, (_, i) => ({
  date: new Date(Date.UTC(2025, 9, 19 + i)).toISOString().slice(0, 10),
  count: i % 10, level: i % 5,
}));
const snapshot = {
  checkedAt: "2026-10-16T12:00:00Z",
  calendar,
  events: [{
    id: "123", kind: "push", repo: "Fors-Corp/a-very-long-public-project-name",
    url: "https://github.com/Fors-Corp/marcfors.com/commits",
    date: "2026-10-16T10:00:00Z",
  }],
};

for (const width of [320, 1280]) {
  test(`GitHub feed and calendar render without page overflow at ${width}px`, async ({ page }) => {
    const thirdParty: string[] = [];
    page.on("request", (request) => {
      if (/^https?:/.test(request.url()) && !request.url().startsWith("http://localhost:3000/")) {
        thirdParty.push(request.url());
      }
    });
    await page.route("**/api/github-activity", (route) => route.fulfill({ json: snapshot }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const activity = page.locator("#github");
    await activity.scrollIntoViewIfNeeded();
    await expect(activity.getByRole("img")).toBeVisible();
    await expect(activity.locator("svg rect")).toHaveCount(364);
    await expect(activity.getByText(snapshot.events[0].repo)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const fills = await activity.locator("svg rect").evaluateAll((rects) =>
      [...new Set(rects.map((rect) => getComputedStyle(rect).fill))]);
    expect(fills).toHaveLength(5);
    const chart = activity.locator(".activity-chart");
    await chart.focus();
    await expect(chart).toBeFocused();
    await activity.locator("summary").click();
    await expect(activity.locator(".activity-days li")).toHaveCount(364);
    await page.screenshot({ path: `/tmp/portfolio-github-${width}.png`, fullPage: false });
    expect(thirdParty).toEqual([]);
  });
}

test("GitHub errors are visible with a working profile link", async ({ page }) => {
  await page.route("**/api/github-activity", (route) => route.fulfill({ status: 503, json: {} }));
  await page.goto("/de");
  const activity = page.locator("#github");
  await activity.scrollIntoViewIfNeeded();
  await expect(activity.getByRole("status")).toContainText("vorübergehend nicht verfügbar");
  await expect(activity.getByRole("link", { name: /GitHub-Profil ansehen/ })).toHaveAttribute("href", "https://github.com/marcfs31");
});
