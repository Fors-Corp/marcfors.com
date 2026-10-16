import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1280]) {
  for (const locale of ["en", "ca", "de"]) {
    test(`technology labels and navigation fit at ${width}px (${locale})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(locale === "en" ? "/" : `/${locale}`);
      await expect(page.locator(".technology-icon").first()).toBeVisible();
      const overflow = await page.evaluate(() => {
        const viewport = document.documentElement.clientWidth;
        return [...document.querySelectorAll<HTMLElement>(
          ".top a, .top button, .top select, .chip, .card, .contact-email, .hero-email",
        )].filter((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && (box.left < -1 || box.right > viewport + 1);
        }).map((element) => element.textContent?.trim() || element.getAttribute("aria-label"));
      });
      expect(overflow).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      for (const chip of await page.locator(".project-card .chip").all()) {
        expect((await chip.boundingBox())!.height).toBeLessThanOrEqual(52);
      }
      for (const target of await page.locator(".nav > a, .theme-dot, .langs a, .lang-select, .project-card .links a").all()) {
        if (!await target.isVisible()) continue;
        expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
    });
  }
}

test("the keyboard skip link moves focus to main content", async ({ page }) => {
  for (const path of ["/", "/de/work/iterm-studio"]) {
    await page.goto(path);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
    await page.keyboard.press("Tab");
    const focusIsInMain = await page.locator("main").evaluate((main) => main.contains(document.activeElement));
    expect(focusIsInMain).toBe(true);
  }
});

test("reduced motion hides the decorative pointer spotlight", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".spot")).toBeHidden();
});

test("the shared technology sprite loads locally and every brand icon has visible geometry", async ({ page, request }) => {
  const response = await request.get("/technology-icons.svg");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect(response.headers()["cache-control"]).toContain("max-age=86400");
  await page.goto("/");
  expect(await page.locator(".technology-icon use").count()).toBeGreaterThan(0);
  await expect.poll(async () => page.locator(".technology-icon use").evaluateAll((icons) =>
    icons.filter((icon) => {
      const box = (icon as SVGGraphicsElement).getBBox();
      return box.width === 0 || box.height === 0;
    }).map((icon) => icon.getAttribute("href")),
  )).toEqual([]);
});
