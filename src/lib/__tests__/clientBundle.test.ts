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
});
