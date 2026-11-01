import { expect, test } from "@playwright/test";
import { findAtlasNodePoint } from "./atlasHit";

// Runs only on the `mobile` project (Pixel 7 viewport), which triggers the
// compact header where the language <select> replaces the locale link row.

test("compact header: the language select switches locale", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Marc Fors" })).toBeVisible();

  const select = page.getByRole("combobox");
  await expect(select).toBeVisible();
  await select.selectOption("de");

  await expect(page).toHaveURL(/\/de$/);
  expect(await page.locator("html").getAttribute("lang")).toBe("de");
});

test("all sections are on the page on a phone, including lab, with no More archive", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#projects")).toBeVisible();
  await expect(page.locator("#work")).toBeVisible();
  await expect(page.locator("#lab")).toBeVisible();
  await expect(page.locator("#contact")).toBeVisible();
  await expect(page.locator("details#more")).toHaveCount(0);
});

test("Wordkeep atlas responds to a real touch tap, not just a mouse hover", async ({ page }) => {
  await page.goto("/work/wordkeep");
  const canvas = page.locator(".atlas-canvas");
  await expect(canvas).toBeVisible();

  // `page.touchscreen.tap` taps literal viewport pixels, so the canvas has to
  // actually be scrolled into view first, same as the desktop click test.
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("atlas canvas has no layout box");
  const hit = await findAtlasNodePoint(page, box);
  expect(hit, "a fine synthetic sweep should find at least one of the 56 nodes").not.toBeNull();

  // The real assertion: an actual touchscreen tap at that spot selects the word.
  const readout = page.locator(".atlas-readout");
  await page.touchscreen.tap(box.x + box.width * hit!.gx, box.y + box.height * hit!.gy);
  await expect(readout).toHaveClass(/\bon\b/);
});
