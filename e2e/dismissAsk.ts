import { expect, type Page } from "@playwright/test";

/**
 * The Ask panel is not in the first paint. It mounts on the first pointer/key,
 * or after load plus a post-TTI idle delay, then opens by default and marks
 * the page inert. Nudge the page with a pointer so tests do not wait the full
 * idle delay, then close the panel before using the page.
 */
export async function dismissAsk(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  const close = page.locator(".ask-fab-close");
  // A closed panel keeps the close control in the DOM under [hidden], before
  // the launcher. Match only a visible control so that hidden button is not
  // the one we wait on.
  const visible = page.locator(".ask-fab-close:visible, .ask-fab-launcher:visible");
  await visible.first().waitFor({ state: "visible", timeout: 15_000 });
  if (!(await close.isVisible())) return;
  await close.click({ force: true });
  await expect(page.locator("[data-page-root]")).not.toHaveAttribute("inert");
}
