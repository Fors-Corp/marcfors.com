import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { careerBreak, contact, copy, education, experience, languages, skills } from "@/data/copy";
import { featured, lab } from "@/data/projects";

// `app/[locale]/layout.tsx` preloads only the `latin` subset of Fraunces and IBM
// Plex Mono. That is safe exactly as long as no shipped string needs a glyph that
// lives in `latin-ext` instead — so this guard fails the build the moment one does.
//
// Failing is the point. next/font still emits the `latin-ext` @font-face rules
// with their `unicode-range`, so a stray character degrades to a lazy fetch rather
// than tofu; the damage is a slow first paint of that glyph, not a broken page.
// This test turns that silent cost into an explicit decision: either rewrite the
// string, or add "latin-ext" back to `subsets` and accept the ~52 KB of preload.
const SRC = path.resolve(__dirname, "../..");
const CONTENT = path.resolve(SRC, "../content");

// Ranges taken from the @font-face descriptors next/font generates for Google Fonts.
const LATIN: [number, number][] = [
  [0x0000, 0x00ff], [0x0131, 0x0131], [0x0152, 0x0153], [0x02bb, 0x02bc], [0x02c6, 0x02c6],
  [0x02da, 0x02da], [0x02dc, 0x02dc], [0x0304, 0x0304], [0x0308, 0x0308], [0x0329, 0x0329],
  [0x2000, 0x206f], [0x2074, 0x2074], [0x20ac, 0x20ac], [0x2122, 0x2122], [0x2191, 0x2191],
  [0x2193, 0x2193], [0x2212, 0x2212], [0x2215, 0x2215], [0xfeff, 0xfeff], [0xfffd, 0xfffd],
];
const LATIN_EXT: [number, number][] = [
  [0x0100, 0x02ba], [0x02bd, 0x02c5], [0x02c7, 0x02cc], [0x02ce, 0x02d7], [0x02dd, 0x02ff],
  [0x1d00, 0x1dbf], [0x1e00, 0x1e9f], [0x1ef2, 0x1eff], [0x2020, 0x2020], [0x20a0, 0x20ab],
  [0x20ad, 0x20c0], [0x2113, 0x2113], [0x2c60, 0x2c7f], [0xa720, 0xa7ff],
];

const covers = (ranges: [number, number][], cp: number) =>
  ranges.some(([lo, hi]) => cp >= lo && cp <= hi);

/** Codepoints that `latin` misses but `latin-ext` would have supplied. */
function needsLatinExt(text: string): string[] {
  const found = new Set<string>();
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x80 || covers(LATIN, cp)) continue;
    if (covers(LATIN_EXT, cp)) found.add(`U+${cp.toString(16).toUpperCase().padStart(4, "0")} "${ch}"`);
  }
  return [...found];
}

function mdxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return mdxFiles(full);
    return name.endsWith(".mdx") ? [full] : [];
  });
}

describe("font subset", () => {
  it("ships no copy that the preloaded `latin` subset cannot render", () => {
    const bundled = JSON.stringify({
      copy, contact, careerBreak, education, experience, languages, skills, featured, lab,
    });
    expect(needsLatinExt(bundled)).toEqual([]);
  });

  it("ships no case-study prose that the preloaded `latin` subset cannot render", () => {
    for (const file of mdxFiles(CONTENT)) {
      expect(needsLatinExt(readFileSync(file, "utf8")), path.relative(CONTENT, file)).toEqual([]);
    }
  });

  it("keeps the layout's subsets and mono weights in sync with that promise", () => {
    const layout = readFileSync(path.join(SRC, "app/[locale]/layout.tsx"), "utf8");
    // Assert on the config expression, not on the file text — the comment above
    // these loaders explains the decision and necessarily names `latin-ext`.
    expect(layout.match(/subsets: \["latin"\]/g)).toHaveLength(2);
    expect(layout).not.toMatch(/subsets: \[[^\]]*latin-ext/);
    // `body { font-family: var(--mono) }` plus `font-synthesis: none` means a
    // missing 500 renders as 400 with no faux-bold — dropping it is a silent
    // visual regression, not an optimisation.
    expect(layout).toMatch(/weight: \["400", "500"\]/);
    expect(readFileSync(path.join(SRC, "app/globals.css"), "utf8")).toMatch(/font-synthesis: none/);
  });
});
