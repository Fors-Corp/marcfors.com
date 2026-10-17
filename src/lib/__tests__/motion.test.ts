import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");
const OPT_IN = "@media screen and (prefers-reduced-motion: no-preference)";

// Body of the block whose opening "{" follows `from`.
function blockAfter(source: string, from: number): string {
  const start = source.indexOf("{", from);
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    if (source[i] === "{") depth++;
    if (source[i] === "}" && --depth === 0) return source.slice(start + 1, i);
  }
  throw new Error("unbalanced braces");
}

describe("motion", () => {
  it("runs every animation only for visitors who have not asked for reduced motion", () => {
    expect(css.split(OPT_IN)).toHaveLength(2);
    const optIn = blockAfter(css, css.indexOf(OPT_IN));
    const outside = css.replace(optIn, "");
    expect(optIn).toMatch(/\banimation:\s*[a-z]/);
    expect(outside).not.toMatch(/(^|[\s;{])animation:\s*[a-z]/m);
  });

  it("never fades content through opacity, so contrast checks see the final colours", () => {
    const keyframes = [...css.matchAll(/@keyframes\s+[\w-]+/g)].map((m) => blockAfter(css, m.index));
    expect(keyframes.length).toBeGreaterThanOrEqual(5);
    for (const body of keyframes) expect(body).not.toMatch(/opacity/);
  });
});
