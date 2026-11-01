"use client";

import { useMemo, type ReactNode } from "react";
import { SignalRail } from "@/components/SignalRail";
import { createSpotlightMove } from "@/lib/spotlight";

/**
 * The desk shell. Everything visual inside is server-rendered and passed as
 * `children`; this island exists only to track the pointer and write the two
 * spotlight custom properties (`--spot-x` / `--spot-y`) on `.desk`. The write is
 * coalesced to one per frame and skipped under `prefers-reduced-motion`
 * (`createSpotlightMove`); `.spot` itself is hidden by that media query in CSS.
 * SignalRail owns the scroll progress rail (`--desk-progress`).
 */
export function SpotlightLayer({ children }: { children: ReactNode }) {
  const onPointerMove = useMemo(() => createSpotlightMove(), []);
  return (
    <div className="desk" onPointerMove={onPointerMove}>
      <div className="grid" aria-hidden="true" />
      <div className="spot" aria-hidden="true" />
      <div className="desk-wash" aria-hidden="true" />
      <SignalRail />
      {children}
    </div>
  );
}
