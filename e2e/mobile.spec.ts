import { expect, test } from "@playwright/test";
import { findAtlasNodePoint } from "./atlasHit";
import { dismissAsk } from "./dismissAsk";

// Runs only on the `mobile` project (Pixel 7 viewport), which triggers the
// compact header where the language <select> replaces the locale link row.

test("compact header: the language menu switches locale", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Marc Fors" })).toBeVisible();

  await dismissAsk(page);
  await page.locator(".langs-menu > summary").click();
  await page.getByRole("link", { name: "DE · Deutsch" }).click();

  await expect(page).toHaveURL(/\/de$/);
  expect(await page.locator("html").getAttribute("lang")).toBe("de");
});

test("all sections are on the page on a phone, with no More archive", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#projects")).toBeVisible();
  await expect(page.locator("#work")).toBeVisible();
  await expect(page.locator("#contact")).toBeVisible();
  await expect(page.locator("details#more")).toHaveCount(0);
});

test("Wordkeep atlas responds to a real touch tap, not just a mouse hover", async ({ page }) => {
  await page.goto("/work/wordkeep");
  await dismissAsk(page);
  const canvas = page.locator(".atlas-canvas");
  await expect(canvas).toBeVisible();

  // Scroll the stage (not the canvas): the sim mutates canvas size during boot,
  // which makes Playwright's scrollIntoViewIfNeeded wait forever for stability.
  const stage = page.locator(".atlas-stage");
  await stage.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await expect(canvas).toHaveAttribute("data-atlas-sized", /\d+x\d+/);
  // A border-box canvas size used to grow the figure on every resize. Give
  // that loop time to overflow the phone, then require the page to stay put.
  const sized = await canvas.getAttribute("data-atlas-sized");
  await page.waitForTimeout(500);
  await expect(canvas).toHaveAttribute("data-atlas-sized", sized!);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  const box = await canvas.boundingBox();
  if (!box) throw new Error("atlas canvas has no layout box");
  const hit = await findAtlasNodePoint(page, box);
  expect(hit, "a fine synthetic sweep should find at least one of the 56 nodes").not.toBeNull();

  // The real assertion: an actual touchscreen tap at that spot selects the word.
  const readout = page.locator(".atlas-readout");
  await page.touchscreen.tap(box.x + box.width * hit!.gx, box.y + box.height * hit!.gy);
  await expect(readout).toHaveClass(/\bon\b/);
});

for (const path of ["/ask", "/lab/trace"]) {
  test(`${path}: text fields are at least 16px so iOS does not zoom on focus`, async ({ page }) => {
    await page.goto(path);
    const field = page.locator("main textarea").first();
    await expect(field).toBeVisible();
    const size = await field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
  });
}

test("stand-alone links are 44px tall to tap; a link inside a sentence is left alone", async ({ page }) => {
  await page.goto("/");
  for (const selector of [".hero-email", ".contact-email"]) {
    const box = await page.locator(selector).first().boundingBox();
    expect(box?.height, selector).toBeGreaterThanOrEqual(44);
  }
  await page.goto("/lab/trace");
  const home = await page.locator("header.top > a:not(.brand)").boundingBox();
  expect(home?.height).toBeGreaterThanOrEqual(44);

  await page.goto("/privacy");
  const inline = await page.locator("main p a").first().boundingBox();
  expect(inline?.height).toBeLessThan(44);
});

test("no page scrolls sideways on the narrowest phone", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const path of ["/", "/de", "/ask", "/cv", "/privacy", "/lab/trace", "/work/embedded-rag", "/de/work/wordkeep"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
