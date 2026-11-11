/**
 * Map the visual viewport onto CSS insets for the floating Ask fab.
 * On iOS Safari the software keyboard shrinks visualViewport.height and leaves
 * fixed bottom UI under the keys; lift by `bottom` and cap height to `height`.
 */
export function askFabViewportInsets(
  viewport: Pick<VisualViewport, "height" | "offsetTop">,
  layoutHeight: number,
): { bottom: number; height: number } {
  const height = Math.max(0, viewport.height);
  const bottom = Math.max(0, layoutHeight - viewport.height - viewport.offsetTop);
  return { bottom, height };
}
