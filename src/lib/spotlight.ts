/**
 * Pointer-driven spotlight for the atlas field.
 *
 * The raw `pointermove` stream fires at input frequency; writing two CSS custom
 * properties on every event is wasteful. `createSpotlightMove` coalesces writes to
 * one per animation frame and skips the work entirely under `prefers-reduced-motion`.
 */

export const SPOT_X = "--spot-x";
export const SPOT_Y = "--spot-y";

type Target = { style: Pick<CSSStyleDeclaration, "setProperty"> };

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function createSpotlightMove(reducedMotion: () => boolean = prefersReducedMotion) {
  let frame = 0;
  let pendingX = 0;
  let pendingY = 0;
  let node: Target | null = null;

  return function onPointerMove(event: { currentTarget: Target; clientX: number; clientY: number }) {
    if (reducedMotion()) return;
    node = event.currentTarget;
    pendingX = event.clientX;
    pendingY = event.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      node?.style.setProperty(SPOT_X, `${pendingX}px`);
      node?.style.setProperty(SPOT_Y, `${pendingY}px`);
    });
  };
}
