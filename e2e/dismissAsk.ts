import { expect, type Page } from "@playwright/test";

/**
 * The Ask panel is not in the first paint. It mounts on the first pointer/key,
 * or after load plus a post-TTI idle delay, then shows the launcher (closed by
 * default). A stored open session still marks the page inert.
 *
 * A single synthetic event can race the DeferredAskWidget effect (listeners
 * not attached yet). Keep nudging until the FAB is visible so e2e does not
 * wait the 45s idle path — without putting Ask back on the Lighthouse path.
 */
export async function dismissAsk(page: Page): Promise<void> {
  const visible = page.locator(".ask-fab-close:visible, .ask-fab-launcher:visible");

  await expect
    .poll(
      async () => {
        if (await visible.first().isVisible()) return "ready";
        await page.evaluate(() => {
          window.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
          window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Shift" }));
        });
        return "waiting";
      },
      { timeout: 15_000, intervals: [50, 100, 200, 400] },
    )
    .toBe("ready");

  const close = page.locator(".ask-fab-close");
  // A closed panel keeps the close control in the DOM under [hidden], before
  // the launcher. Match only a visible control so that hidden button is not
  // the one we wait on.
  if (!(await close.isVisible())) return;
  await close.click({ force: true });
  await expect(page.locator("[data-page-root]")).not.toHaveAttribute("inert");
}
