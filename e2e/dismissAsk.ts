import { expect, type Page } from "@playwright/test";

/**
 * The Ask panel is not in the first paint. It mounts on idle (or the first
 * pointer/key) and then opens by default, which marks the page inert. Wait
 * for that widget and close it when it is open, before the test uses the page.
 */
export async function dismissAsk(page: Page): Promise<void> {
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
