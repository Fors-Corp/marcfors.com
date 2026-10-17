import { describe, expect, it } from "vitest";
import { careerBreak, copy } from "@/data/copy";
import { RECRUITER_SKILLS, RECRUITER_TOKENS, splitEmphasis } from "@/lib/emphasize";
import { skills } from "@/data/copy/shared";
import { LOCALES } from "@/lib/locale";

describe("recruiter emphasis", () => {
  it("wraps the longest matching phrase first", () => {
    const pieces = splitEmphasis("Strong in React and TypeScript, and React.", [
      "React",
      "React and TypeScript",
    ]);
    expect(pieces.filter((piece) => piece.hit).map((piece) => piece.text)).toEqual([
      "React and TypeScript",
      "React",
    ]);
  });

  it("keeps every locale’s recruiter hits inside shipped copy", () => {
    for (const locale of LOCALES) {
      const t = copy[locale];
      const blob = [
        t.lede,
        t.contactLede,
        t.hirePathLede,
        t.headline,
        t.kicker,
        careerBreak[locale].body,
      ].join("\n");
      expect(t.hits.length).toBeGreaterThan(3);
      expect(t.hits.every((hit) => blob.includes(hit))).toBe(true);
    }
  });

  it("highlights every testing technology plus Git, CI/CD and REST APIs in the stack", () => {
    for (const name of [...skills.testing, "Git", "CI/CD", "REST APIs"]) {
      expect(RECRUITER_SKILLS.has(name)).toBe(true);
    }
    expect(RECRUITER_SKILLS.has("Mentoring")).toBe(false);
  });

  it("never emphasises GitHub as if it were the Git skill", () => {
    const pieces = splitEmphasis("Shipped on GitHub with CI/CD", RECRUITER_TOKENS);
    expect(pieces.filter((piece) => piece.hit).map((piece) => piece.text)).toEqual(["CI/CD"]);
  });
});
