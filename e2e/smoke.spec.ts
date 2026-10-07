import { expect, test } from "@playwright/test";
import { copy } from "../src/data/copy";
import { findAtlasNodePoint } from "./atlasHit";

test("home renders the desk in English", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Marc Fors/);
  await expect(page.getByRole("heading", { level: 1, name: "Marc Fors" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("language switch changes the URL and the lang attribute", async ({ page }) => {
  await page.goto("/");
  // Desktop header shows the locale links; the <select> is a mobile-only fallback.
  await page.getByRole("link", { name: "Español" }).click();
  await expect(page).toHaveURL(/\/es$/);
  expect(await page.locator("html").getAttribute("lang")).toBe("es");
});

test("a theme pick sticks across a reload", async ({ page }) => {
  await page.goto("/");
  await page.locator(".theme-dot-blue").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "blue");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "blue");
});

test("every section is on the page at once, and a nav link jumps to one", async ({ page }) => {
  await page.goto("/");
  for (const id of ["intro", "projects", "work", "skills", "contact", "signal", "edu"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  // No accordion: section headings are plain, not expand/collapse controls.
  await expect(page.locator(".fold-head")).toHaveCount(0);
  await expect(page.locator("[aria-expanded]")).toHaveCount(0);

  await page.getByRole("link", { name: "Selected work" }).first().click();
  await expect(page).toHaveURL(/#projects$/);
});

test("the archive is the only collapsed block and it opens on click", async ({ page }) => {
  await page.goto("/");
  const archive = page.locator("details#more");
  await expect(archive).not.toHaveAttribute("open", /.*/);
  await archive.locator("summary").click();
  await expect(archive).toHaveAttribute("open", /.*/);
});

test("print route renders the CV", async ({ page }) => {
  await page.goto("/print");
  await expect(page.getByRole("heading", { level: 1, name: "Marc Fors" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stack" })).toBeVisible();
  await expect(page.getByText(/T-Systems/)).toBeVisible();
});

test("Wordkeep case study embeds the atlas and links out to the live project", async ({ page }) => {
  await page.goto("/work/wordkeep");
  await expect(page.getByRole("heading", { level: 1, name: "Wordkeep" })).toBeVisible();
  await expect(page.locator(".atlas-canvas")).toBeVisible();
  await expect(page.getByText("56 words · 90 links · 4 languages")).toBeVisible();
  const openAtlas = page.getByRole("link", { name: "Open the 3D atlas" });
  const visit = page.getByRole("link", { name: "Visit Wordkeep" });
  await expect(openAtlas).toHaveAttribute("href", "https://wordkeep-zeta.vercel.app/graph");
  await expect(visit).toHaveAttribute("href", "https://wordkeep-zeta.vercel.app");
});

test("Wordkeep atlas: a click selects a word and shows its links, and the canvas claims touch gestures", async ({
  page,
}) => {
  await page.goto("/work/wordkeep");
  const canvas = page.locator(".atlas-canvas");
  await expect(canvas).toBeVisible();

  // The bug this guards against: `touch-action: pan-y` handed a finger-drag to
  // page scroll before the canvas's own pointer handlers ever saw it, so nodes
  // could not be dragged (or reliably tapped) on a touchscreen.
  await expect(canvas).toHaveCSS("touch-action", "none");

  // The case study text pushes the atlas below the fold — `page.mouse.click`
  // clicks literal viewport pixels, so the canvas has to actually be scrolled
  // into view first or the coordinates below land past the visible viewport.
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("atlas canvas has no layout box");
  const hit = await findAtlasNodePoint(page, box);
  expect(hit, "a fine synthetic sweep should find at least one of the 56 nodes").not.toBeNull();

  // The real assertion: an actual mouse click at that spot selects the word.
  const readout = page.locator(".atlas-readout");
  await page.mouse.click(box.x + box.width * hit!.gx, box.y + box.height * hit!.gy);
  await expect(readout).toHaveClass(/\bon\b/);
  await expect(readout.locator("strong")).not.toBeEmpty();
  await expect(readout).toContainText(/synonym|antonym|translation|related/);
});

test("health endpoint is public JSON", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.service).toBe("marcfors.com");
});

test("unknown path returns a styled 404", async ({ page }) => {
  const res = await page.goto("/nonsense-path");
  expect(res?.status()).toBe(404);
  await expect(page.getByText(/page not found/i)).toBeVisible();
});

test("privacy notice renders and localizes", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1, name: copy.en.privacyTitle })).toBeVisible();
  await expect(page.locator("main")).toContainText("marcfors-locale");
  await page.goto("/de/privacy");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
});
