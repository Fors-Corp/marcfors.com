import { describe, expect, it } from "vitest";
import { escapeIlike, significantTokens } from "@/lib/rag/lexical";

describe("rag lexical helpers", () => {
  it("escapes ILIKE wildcards", () => {
    expect(escapeIlike("100%_done")).toBe("100\\%\\_done");
  });

  it("keeps short letter tokens like CV and drops stopwords", () => {
    expect(significantTokens("What is my CV about?")).toEqual(["CV"]);
    expect(significantTokens("Where is Marc based?")).toEqual(["Marc", "based"]);
  });
});
