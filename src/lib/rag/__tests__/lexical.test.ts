import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { contextCoversQuestion, escapeIlike, significantTokens } from "@/lib/rag/lexical";

describe("rag lexical helpers", () => {
  it("escapes ILIKE wildcards", () => {
    expect(escapeIlike("100%_done")).toBe("100\\%\\_done");
  });

  it("keeps short letter tokens like CV and drops stopwords", () => {
    expect(significantTokens("What is my CV about?")).toEqual(["CV"]);
    expect(significantTokens("Where is Marc based?")).toEqual(["Marc", "based"]);
  });

  it("treats a chunk as covering the remote-roles question only when the fact is present", () => {
    const question = "Is Marc open to remote roles?";
    expect(
      contextCoversQuestion("Open to remote roles and AI engineering roles.", question),
    ).toBe(true);
    expect(contextCoversQuestion("Marc builds design systems.", question)).toBe(false);
  });

  it("keeps the remote-roles fact in the portfolio corpus", () => {
    const corpus = path.join(process.cwd(), "corpus");
    const about = readFileSync(path.join(corpus, "about.md"), "utf8");
    const experience = readFileSync(path.join(corpus, "experience.md"), "utf8");
    expect(about).toMatch(/Open to remote roles/i);
    expect(experience).toMatch(/Open to remote roles/i);
  });
});
