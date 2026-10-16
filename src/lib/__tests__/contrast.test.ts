import { describe, expect, it } from "vitest";
import { AA_NORMAL, contrastRatio } from "@/lib/contrast";
import { THEME_PALETTES } from "@/lib/themePalettes";

describe("palette contrast", () => {
  it.each(Object.entries(THEME_PALETTES))("keeps all text and filled controls at AA in the %s theme", (_name, palette) => {
    const panel = palette.surface.match(/[\d.]+/g)!.map(Number);
    const composite = (background: string) => {
      const rgb = background.match(/[a-f\d]{2}/gi)!.map((value) => Number.parseInt(value, 16));
      return "#" + rgb.map((value, i) =>
        Math.round(panel[i] * panel[3] + value * (1 - panel[3])).toString(16).padStart(2, "0"),
      ).join("");
    };
    for (const background of [palette.bg, palette.bg2, composite(palette.bg), composite(palette.bg2)]) {
      for (const token of ["fg", "fgDim", "muted", "accent", "signal", "danger"] as const) {
        expect(contrastRatio(palette[token], background), `${token} on ${background}`).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    }
    expect(contrastRatio(palette.accentFg, palette.accent)).toBeGreaterThanOrEqual(AA_NORMAL);
  });

  it("keeps paper, brass, signal and muted above AA on ink (dark palette)", () => {
    const { bg, fg, accent, signal, muted } = THEME_PALETTES.dark;
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(accent, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(signal, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(muted, bg)).toBeGreaterThanOrEqual(AA_NORMAL);
    expect(contrastRatio(bg, accent)).toBeGreaterThanOrEqual(AA_NORMAL);
  });
});
