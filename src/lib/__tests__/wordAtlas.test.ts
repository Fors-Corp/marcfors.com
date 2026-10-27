import { describe, expect, it } from "vitest";
import {
  ATLAS_COPY,
  ATLAS_STATS,
  WORD_ATLAS,
  WORDKEEP_GRAPH_URL,
  WORDKEEP_URL,
  type AtlasRelation,
} from "@/data/wordAtlas";
import { LOCALES } from "@/lib/locale";

const RELATIONS: AtlasRelation[] = ["syn", "ant", "tr", "rel"];

describe("word atlas snapshot", () => {
  it("holds the frozen Wordkeep graph: 56 words, 90 links, 4 languages", () => {
    expect(WORD_ATLAS.nodes).toHaveLength(56);
    expect(WORD_ATLAS.edges).toHaveLength(90);
    expect(ATLAS_STATS).toMatchObject({ words: 56, links: 90, languages: 4 });
    expect(new Set(WORD_ATLAS.nodes.map((n) => n.lang))).toEqual(new Set(["en", "es", "fr", "de"]));
  });

  it("keeps every edge endpoint in range with a known relation", () => {
    for (const [a, b, r] of WORD_ATLAS.edges) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(56);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(56);
      expect(a).not.toBe(b);
      expect(RELATIONS).toContain(r);
    }
  });

  it("tallies relations the same way the legend shows them", () => {
    expect(ATLAS_STATS.byRelation).toEqual({ syn: 18, ant: 39, tr: 27, rel: 6 });
  });

  it("points at the live Wordkeep project", () => {
    expect(WORDKEEP_URL).toBe("https://wordkeep.me");
    expect(WORDKEEP_GRAPH_URL).toBe("https://wordkeep.me/graph");
  });

  it("localizes the atlas micro-copy for every shipped locale", () => {
    const keys = Object.keys(ATLAS_COPY.en);
    for (const locale of LOCALES) {
      const c = ATLAS_COPY[locale];
      expect(Object.keys(c)).toEqual(keys);
      expect(Object.keys(c.rel)).toEqual(RELATIONS);
      expect(c.heading.length).toBeGreaterThan(0);
      expect(c.lede.length).toBeGreaterThan(40);
      if (locale !== "en") expect(c.lede).not.toBe(ATLAS_COPY.en.lede);
    }
  });
});
