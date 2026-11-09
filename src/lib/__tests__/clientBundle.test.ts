import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Importing the six-locale `copy` map into a Client Component ships every
// locale's strings to every visitor. Server Components render on the server and
// hand islands only the strings they need as props. This guard fails if a
// `"use client"` file re-adds a `copy` barrel import.
const SRC = path.resolve(__dirname, "../..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "__tests__" || name === "node_modules") return [];
      return walk(full);
    }
    return /\.(tsx?|mts)$/.test(name) ? [full] : [];
  });
}

describe("client/server boundary", () => {
  it("keeps the technology icon catalog out of Client Components", () => {
    const offenders = walk(SRC).filter((file) => {
      const text = readFileSync(file, "utf8");
      return /^["']use client["'];/m.test(text) &&
        /from ["'](?:simple-icons|@\/components\/TechnologyChips|@\/lib\/technologyIcons)["']/.test(text);
    });
    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
  });

  it("no Client Component imports the full copy map", () => {
    const offenders = walk(SRC).filter((file) => {
      const text = readFileSync(file, "utf8");
      if (!/^["']use client["'];/m.test(text)) return false;
      return /from ["']@\/data\/copy["']/.test(text);
    });
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  it("keeps pdfjs-dist off every module except the CV canvas embed", () => {
    // A static `from "pdfjs-dist"` (even type-only) can pull the library into a
    // shared client graph and inflate homepage TBT. Only CvPdfEmbed may load it,
    // and only via dynamic import().
    const importRe = /(?:from\s+["']pdfjs-dist["']|import\s*\(\s*["']pdfjs-dist["']\s*\))/;
    const offenders = walk(SRC).filter((file) => {
      const rel = path.relative(SRC, file);
      if (rel.includes(`${path.sep}__tests__${path.sep}`)) return false;
      const text = readFileSync(file, "utf8");
      if (!importRe.test(text)) return false;
      // The canvas embed may dynamic-import the package; nothing else may.
      if (rel === path.join("components", "CvPdfEmbed.tsx")) {
        return /\bfrom\s+["']pdfjs-dist["']/.test(text);
      }
      return true;
    });
    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
  });

  it("loads the CV canvas embed only through the dynamic lazy boundary", () => {
    const offenders = walk(SRC).filter((file) => {
      const rel = path.relative(SRC, file);
      if (rel === path.join("components", "CvPdfEmbedLazy.tsx")) return false;
      if (rel.includes(`${path.sep}__tests__${path.sep}`)) return false;
      const text = readFileSync(file, "utf8");
      return /from\s+["']@\/components\/CvPdfEmbed["']/.test(text);
    });
    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
  });
});
