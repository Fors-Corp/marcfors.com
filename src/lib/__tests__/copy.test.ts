import { describe, expect, it } from "vitest";
import { careerBreak, copy, education, experience, languages, skills } from "@/data/copy";
import { LOCALES } from "@/lib/locale";
import { VITAL_NAMES } from "@/lib/vitals";

describe("locale copy", () => {
  it("keeps every locale’s keys in lockstep", () => {
    const keys = Object.keys(copy.en);
    for (const locale of LOCALES) {
      expect(Object.keys(copy[locale])).toEqual(keys);
      expect(Object.keys(copy[locale].skillGroups)).toEqual(Object.keys(copy.en.skillGroups));
      expect(Object.keys(copy[locale].vitalDefs)).toEqual([...VITAL_NAMES]);
      expect(experience[locale]).toHaveLength(experience.en.length);
      expect(education[locale]).toHaveLength(education.en.length);
      expect(experience[locale][0]?.points.length).toBe(experience.en[0]?.points.length);
    }
  });

  it("actually translates the prose fields (no English left in place)", () => {
    const prose = ["lede", "contactLede", "hirePathLede", "buildPathLede"] as const;
    for (const locale of LOCALES.filter((l) => l !== "en")) {
      for (const key of prose) {
        expect(copy[locale][key], `${locale}.${key}`).not.toBe(copy.en[key]);
      }
      expect(careerBreak[locale].body, `${locale} career break`).not.toBe(careerBreak.en.body);
    }
  });

  it("leads with independent practice, not a current Dynatrace role", () => {
    expect(copy.en.breakTitle).toMatch(/independent practice/i);
    expect(careerBreak.en.when).toMatch(/Dec 2025/i);
    expect(careerBreak.en.body).toMatch(/LLM agents/i);
    expect(experience.en[0]?.org).toBe("Dynatrace");
    expect(experience.en[0]?.when).toMatch(/Nov 2025/);
    expect(`${careerBreak.en.body} ${experience.en[0]?.body}`).not.toMatch(/currently at Dynatrace/i);
  });

  it("makes recruiter and custom-work paths obvious", () => {
    expect(copy.en.kicker).toMatch(/open to work/i);
    expect(copy.en.headline).toMatch(/AI software engineer/i);
    expect(copy.en.breakTitle).toMatch(/Fors Corp/);
    expect(copy.en.tagline).toMatch(/LLM agents/);
    expect(Object.values(copy).map((t) => t.proofLine).join("\n")).not.toMatch(/mlaas/);
    expect(copy.en.hirePath).toMatch(/recruiter/i);
    expect(copy.en.buildPath).toMatch(/custom/i);
    expect(copy.en.seeking).toMatch(/AI engineering|LLM agents/i);
    expect(copy.en.seeking).toMatch(/barcelona/i);
    expect(copy.en.seeking).toMatch(/available now/i);
    expect(copy.en.proofMetric).toMatch(/~20%/);
    expect(copy.en.hireCta).toMatch(/hire/i);
    expect(copy.en.buildCta).toMatch(/commission/i);
    expect(copy.en.contactLede).toMatch(/recruiter/i);
    expect(copy.en.contactLede).toMatch(/custom app/i);
  });

  it("covers the CV skill groups", () => {
    expect(skills.frontend).toContain("React");
    expect(skills.frontend).toContain("State management");
    expect(skills.testing).toContain("Playwright");
    expect(skills.engineering).toContain("Agile");
    expect(skills.backend).toContain("Spring");
    expect(languages.en).toMatch(/German beginner/i);
  });
});
