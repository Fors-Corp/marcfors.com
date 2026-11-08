import { expect, type Page } from "@playwright/test";

/** The Ask panel opens by default and marks the page inert. */
export async function dismissAsk(page: Page): Promise<void> {
  const close = page.locator(".ask-fab-close");
  if (!(await close.isVisible())) return;
  await close.click({ force: true });
  await expect(page.locator("[data-page-root]")).not.toHaveAttribute("inert");
}
