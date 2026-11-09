import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectSeedDocuments } from "./corpusDocs.js";
import { CV_SOURCE_PATH } from "./extractCv.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("collectSeedDocuments", () => {
  it("includes curated markdown plus exactly one CV source path", async () => {
    const docs = await collectSeedDocuments(root);
    const paths = docs.map((d) => d.sourcePath);
    expect(paths).toContain("about.md");
    expect(paths).toContain("experience.md");
    expect(paths).toContain(CV_SOURCE_PATH);
    expect(paths.filter((p) => p === CV_SOURCE_PATH)).toHaveLength(1);
    expect(paths.filter((p) => p.startsWith("cv/"))).toHaveLength(1);

    const cv = docs.find((d) => d.sourcePath === CV_SOURCE_PATH)!;
    expect(cv.text).toContain("developer@marcfors.com");
    expect(cv.text).toMatch(/Italian \(intermediate\)/);
  });
});
