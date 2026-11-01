"use client";

import { useEffect } from "react";

/**
 * Desk reading progress as a fixed signal rail. Writes `--desk-progress` (0–1)
 * on `:root` once per frame while the visitor scrolls. Under
 * `prefers-reduced-motion` the rail fills immediately so layout never depends
 * on this script.
 */
export function SignalRail() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      document.documentElement.style.setProperty("--desk-progress", "1");
      return;
    }

    let frame = 0;
    const write = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      document.documentElement.style.setProperty("--desk-progress", String(next));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="signal-rail" aria-hidden="true" />;
}
