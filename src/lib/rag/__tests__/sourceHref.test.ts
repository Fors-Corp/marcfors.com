import { describe, expect, it } from "vitest";
import { sourceHref } from "@/lib/rag/sourceHref";

describe("sourceHref", () => {
  it("maps corpus files onto portfolio sections", () => {
    expect(sourceHref("about.md", "en")).toBe("/#intro");
    expect(sourceHref("skills.md", "es")).toBe("/es/#skills");
    expect(sourceHref("work/embedded-rag.md", "en")).toBe("/work/embedded-rag");
    expect(sourceHref("work/mensura.md", "ca")).toBe("/ca/work/mensura");
    expect(sourceHref("notes.txt", "en")).toBe("/#projects");
  });
});
