"use client";

import { useEffect } from "react";

/**
 * After client navigations (e.g. Ask CV citations → /cv#cv-download), move
 * keyboard focus to the fragment target when it is focusable.
 */
export function FocusHashTarget({ id }: { id: string }) {
  useEffect(() => {
    const focus = () => {
      if (window.location.hash.replace(/^#/, "") !== id) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLElement) {
        el.focus({ preventScroll: false });
      }
    };
    focus();
    // Ask closes the panel in the same tick as navigation; one frame later
    // the hash is reliable and the FAB has released focus intent.
    const raf = requestAnimationFrame(focus);
    window.addEventListener("hashchange", focus);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("hashchange", focus);
    };
  }, [id]);

  return null;
}
