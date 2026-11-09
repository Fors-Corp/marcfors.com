import { describe, expect, it } from "vitest";
import {
  CV_SOURCE_PATH,
  foldAccents,
  namedSourcePaths,
  prefersCvSource,
  rankLexicalHits,
  reciprocalRankFusion,
  significantTokens,
} from "@/lib/rag/lexical";
import { preferCvChunks } from "@/lib/rag/rank";
import type { ChunkRow } from "@/lib/rag/types";

describe("CV-aware retrieval helpers", () => {
  it("detects named CV paths in the question", () => {
    expect(namedSourcePaths("What does marc-fors-cv.pdf say about Wordkeep?")).toEqual([
      CV_SOURCE_PATH,
    ]);
    expect(namedSourcePaths("See cv/marc-fors-cv.pdf")).toEqual([CV_SOURCE_PATH]);
    expect(namedSourcePaths("Where is Marc based?")).toEqual([]);
  });

  it("prefers CV retrieve for résumé wording", () => {
    expect(prefersCvSource("What does my CV say about Dynatrace?")).toBe(true);
    expect(prefersCvSource("Qué dice el currículum sobre Mensura?")).toBe(true);
    expect(prefersCvSource("What is Wordkeep?")).toBe(false);
  });

  it("folds accents for Spanish tokens", () => {
    expect(foldAccents("dónde")).toBe("donde");
    expect(significantTokens("¿Dónde vive Marc?")).toEqual(
      expect.arrayContaining(["vive", "Marc"]),
    );
  });

  it("ranks lexical hits toward CV paths and multi-token overlap", () => {
    const ranked = rankLexicalHits(
      [
        {
          content: "Wordkeep teaches languages",
          source_path: "projects.md",
          chunk_index: 0,
          tokenHits: 0,
        },
        {
          content: "Languages: Spanish, Catalan (native); Italian (intermediate)",
          source_path: CV_SOURCE_PATH,
          chunk_index: 1,
          tokenHits: 0,
        },
      ],
      ["Languages", "Italian"],
      2,
    );
    expect(ranked[0]?.source_path).toBe(CV_SOURCE_PATH);
  });

  it("fuses vector and lexical lists with RRF", () => {
    const fused = reciprocalRankFusion(
      [
        [
          {
            key: "about.md::0",
            row: {
              content: "about",
              source_path: "about.md",
              chunk_index: 0,
              tokenHits: 0,
              distance: 0.2,
            },
          },
        ],
        [
          {
            key: `${CV_SOURCE_PATH}::0`,
            row: {
              content: "cv",
              source_path: CV_SOURCE_PATH,
              chunk_index: 0,
              tokenHits: 2,
              distance: 0,
            },
          },
          {
            key: "about.md::0",
            row: {
              content: "about",
              source_path: "about.md",
              chunk_index: 0,
              tokenHits: 1,
              distance: 0,
            },
          },
        ],
      ],
      2,
    );
    expect(fused.map((r) => r.source_path)).toContain(CV_SOURCE_PATH);
    expect(fused.map((r) => r.source_path)).toContain("about.md");
  });

  it("boosts CV chunks when distances are close", () => {
    const rows: ChunkRow[] = [
      {
        content: "thin about",
        source_path: "about.md",
        chunk_index: 0,
        distance: 0.31,
      },
      {
        content: "cv languages",
        source_path: CV_SOURCE_PATH,
        chunk_index: 0,
        distance: 0.33,
      },
    ];
    expect(preferCvChunks(rows)[0]?.source_path).toBe(CV_SOURCE_PATH);
  });
});
