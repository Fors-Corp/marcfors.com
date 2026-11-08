import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { featured } from "@/data/projects";

const CORPUS = path.join(process.cwd(), "corpus");

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMarkdown(full));
      continue;
    }
    if (entry.name === "ATTRIBUTION") continue;
    if (/\.(md|txt)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

describe("Mensura wording preferences", () => {
  it("keeps homepage Mensura blurbs free of substance/drug wording", () => {
    const mensura = featured.find((project) => project.name === "Mensura");
    expect(mensura).toBeTruthy();
    for (const blurb of Object.values(mensura!.blurb)) {
      expect(blurb).not.toMatch(/substance|drug/i);
      expect(blurb).toMatch(/on-device|dispositivo|dispositiu|appareil|Gerät|device/i);
    }
  });

  it("indexes Mensura corpus without substance/drug product wording", () => {
    const files = walkMarkdown(CORPUS);
    expect(files.some((file) => file.endsWith(`${path.sep}mensura.md`))).toBe(true);
    for (const file of files) {
      const body = readFileSync(file, "utf8");
      if (path.basename(file) === "ATTRIBUTION") continue;
      expect(body, path.relative(CORPUS, file)).not.toMatch(/\bsubstance\b|\bdrug\b/i);
    }
  });
});
