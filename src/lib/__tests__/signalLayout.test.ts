import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatVital,
  HEALTH_LINE_MIN_PX,
  METER_VALUE_MIN_CH,
  ratingFor,
  VITAL_GOOD,
  VITAL_NAMES,
  VITALS_CARD_MIN_PX,
} from "@/lib/vitals";

// Behaviour of the signal board itself is covered by SignalBoard.test.tsx and
// Desk.test.tsx. What remains here is the CSS layout-stability contract — the one
// thing that needs a real stylesheet and cannot be asserted from a jsdom render —
// plus the numeric web-vitals rules the board depends on.
const css = readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");

describe("displayed signals keep a stable layout", () => {
  it("reserves width and height so a pending value cannot shift the desk", () => {
    expect(css).toContain("font-variant-numeric: tabular-nums");
    expect(css).toContain(`min-width: ${METER_VALUE_MIN_CH}ch`);
    expect(css).toContain(`min-height: ${VITALS_CARD_MIN_PX}px`);
    expect(css).toContain(`min-height: ${HEALTH_LINE_MIN_PX}px`);
    expect(css).toMatch(/\.hero \{[\s\S]*contain: layout/);
    expect(css).toMatch(/\.card \{[\s\S]*contain: layout/);
    expect(css).toContain("scrollbar-width: none");
    expect(css).toMatch(/html::-webkit-scrollbar\s*\{\s*display:\s*none/);
    expect(css).not.toContain("scrollbar-gutter: stable");
    expect(css).toMatch(/\.tip \{[\s\S]*position: absolute/);
    expect(css).toContain("white-space: nowrap");
  });

  it("stacks the desk as one open scannable column with no archive fold", () => {
    expect(css).toMatch(/\.sheet \{[\s\S]*flex-direction: column/);
    expect(css).toMatch(/\.section \{[\s\S]*border-top: 1px solid var\(--line\)/);
    expect(css).not.toContain(".archive[open] > summary");
    expect(css).toContain("content-visibility: auto");
    expect(css).toContain(".signal-rail");
  });

  it("keeps every displayed vital's good ceiling at the Core Web Vitals bar", () => {
    for (const name of VITAL_NAMES) {
      expect(ratingFor(name, VITAL_GOOD[name])).toBe("good");
      expect(ratingFor(name, VITAL_GOOD[name] + VITAL_GOOD[name] * 0.05)).not.toBe("good");
    }
    expect(VITAL_NAMES).toHaveLength(5);
    expect(VITAL_GOOD.CLS).toBe(0.1);
    expect(formatVital("CLS", 0.012)).toBe("0.012");
    expect(formatVital("LCP", 1200.4)).toBe("1200 ms");
  });
});
