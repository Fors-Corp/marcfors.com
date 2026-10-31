import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Radius tokens are defined in scales.css; every rounded surface that consumes
// them is in globals.css. Scan both together.
const css =
  readFileSync(path.resolve(__dirname, "../../app/styles/scales.css"), "utf8") +
  "\n" +
  readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");

// Guards the shared corner-radius scale so surfaces don't drift back to hard 0
// corners or one-off pixel values.
describe("radius scale", () => {
  it("defines the full token scale", () => {
    for (const token of ["--r-2xs", "--r-xs", "--r-sm", "--r-md", "--r-lg", "--r-pill"]) {
      expect(css).toMatch(new RegExp(`${token}:\\s*[0-9]`));
    }
  });

  it("routes every rounded surface through a token", () => {
    // No literal `border-radius: 0` and no stray pixel radii (50% for dots and
    // tokens are the only allowed forms).
    const decls = [...css.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim());
    expect(decls.length).toBeGreaterThan(6);
    for (const value of decls) {
      expect(value === "50%" || value.includes("var(--r-"), `border-radius: ${value}`).toBe(true);
    }
  });

  it("rounds the language select, cards and the language pill through tokens", () => {
    expect(css).toMatch(/\.lang-select\s*\{[^}]*border-radius:\s*var\(--r-xs\)/);
    expect(css).toMatch(/\.card\s*\{[^}]*border-radius:\s*var\(--r-md\)/);
    expect(css).toMatch(/\.langs \{[^}]*border-radius:\s*var\(--r-pill\)/);
  });
});
