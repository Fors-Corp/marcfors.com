import { describe, expect, it } from "vitest";
import { REFUSAL } from "@/lib/rag/constants";
import { citationsForAnswer } from "@/lib/rag/ask";
import type { ChunkRow } from "@/lib/rag/types";

const rows: ChunkRow[] = [
  {
    content: "Wordkeep teaches languages.",
    source_path: "projects.md",
    chunk_index: 0,
    distance: 0.2,
  },
  {
    content: "Marc is based in Barcelona.",
    source_path: "about.md",
    chunk_index: 1,
    distance: 0.3,
  },
];

describe("citationsForAnswer", () => {
  it("returns no citations on the fixed abstain", () => {
    expect(citationsForAnswer(REFUSAL, rows)).toEqual([]);
  });

  it("prefers sources mentioned in the answer", () => {
    const cited = citationsForAnswer("See about.md for location.", rows);
    expect(cited).toHaveLength(1);
    expect(cited[0]?.source_path).toBe("about.md");
  });

  it("returns no citations when the answer names none of the retrieved paths", () => {
    // Fail-closed: do not decorate uncited prose with every retrieved row
    // (aligned with embedded-rag citationsFromMentions).
    const cited = citationsForAnswer("Marc builds language apps.", rows);
    expect(cited).toEqual([]);
  });
});
