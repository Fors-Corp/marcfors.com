import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AA_NORMAL, contrastRatio } from "@/lib/contrast";
import {
  ANTI_FLASH_SCRIPT,
  DEFAULT_THEME,
  PALETTE_THEMES,
  resolveTheme,
  THEME_CHOICES,
  THEME_KEY,
} from "@/lib/theme";
import { cssVars, THEME_PALETTES } from "@/lib/themePalettes";

// Theme colour blocks live in the generated tokens.css; the system swatch and
// everything else stays in globals.css.
const css =
  readFileSync(path.resolve(__dirname, "../../app/styles/tokens.css"), "utf8") +
  "\n" +
  readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");

describe("themes", () => {
  it("ships a CSS block for every palette token", () => {
    expect(PALETTE_THEMES).toEqual(["light", "dark", "green", "blue", "red"]);
    expect(THEME_CHOICES).toEqual(["system", ...PALETTE_THEMES]);
    for (const name of PALETTE_THEMES) {
      const vars = cssVars(THEME_PALETTES[name]);
      expect(css).toContain(`[data-theme="${name}"]`);
      expect(css).toContain(vars["--ink"]);
      expect(css).toContain(vars["--brass"]);
      expect(css).toContain(vars["--signal"]);
    }
    expect(css).toContain(".theme-dot-system");
  });

  it("resolves system to the OS light or dark palette", () => {
    expect(resolveTheme("system", true)).toBe("light");
    expect(resolveTheme("system", false)).toBe("dark");
    expect(resolveTheme("green", true)).toBe("green");
  });

  it("keeps the anti-flash boot script in sync with theme constants", () => {
    for (const choice of THEME_CHOICES) {
      expect(ANTI_FLASH_SCRIPT).toContain(`"${choice}"`);
    }
    for (const palette of PALETTE_THEMES) {
      expect(ANTI_FLASH_SCRIPT).toContain(`"${palette}"`);
    }
    expect(ANTI_FLASH_SCRIPT).toContain(`getItem("${THEME_KEY}")`);
    expect(ANTI_FLASH_SCRIPT).toContain(`?stored:"${DEFAULT_THEME}"`);
  });

  it("keeps body copy and CTAs above AA in every theme", () => {
    for (const name of PALETTE_THEMES) {
      const p = THEME_PALETTES[name];
      expect(contrastRatio(p.fg, p.bg), `${name} paper/ink`).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(contrastRatio(p.accentFg, p.accent), `${name} cta`).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(contrastRatio(p.signal, p.bg), `${name} signal`).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });
});
