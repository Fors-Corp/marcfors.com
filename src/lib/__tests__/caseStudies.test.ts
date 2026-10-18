import { describe, expect, it } from "vitest";
import { caseStudyBody, caseStudyBySlug, listCaseStudySlugs } from "@/data/caseStudies";
import { LOCALES } from "@/lib/locale";

describe("case studies", () => {
  it("lists every case study, sorted by order", () => {
    const slugs = listCaseStudySlugs();
    expect(slugs).toEqual(["wordkeep", "habit-breaker", "iterm-studio", "gatto", "francesc-cescju"]);
  });

  it("has matching frontmatter across every locale, differing only in description", () => {
    for (const slug of listCaseStudySlugs()) {
      const en = caseStudyBySlug(slug, "en")!;
      expect(en).toBeDefined();
      for (const locale of LOCALES) {
        const study = caseStudyBySlug(slug, locale);
        expect(study, `${slug}/${locale}`).toBeDefined();
        expect(study?.project).toBe(en.project);
        expect(study?.stack).toEqual(en.stack);
        expect(study?.live).toBe(en.live);
        expect(study?.repo).toBe(en.repo);
        expect(study?.order).toBe(en.order);
        expect(study?.description.length).toBeGreaterThan(0);
        if (locale !== "en") {
          expect(study?.description, `${slug}/${locale} description`).not.toBe(en.description);
        }
      }
    }
  });

  it("translates every locale's body, not just its description", () => {
    for (const slug of listCaseStudySlugs()) {
      const en = caseStudyBody(slug, "en")!;
      expect(en.length).toBeGreaterThan(0);
      for (const locale of LOCALES.filter((l) => l !== "en")) {
        expect(caseStudyBody(slug, locale), `${slug}/${locale} body`).not.toBe(en);
      }
    }
  });

  it("ships Habit Breaker as a live product without a private repo URL", () => {
    const habit = caseStudyBySlug("habit-breaker", "en");
    expect(habit?.live).toMatch(/^https:\/\//);
    expect(habit?.repo).toBeUndefined();
  });

  it("describes Gatto's delivered outcome without exposing private contact details or source", () => {
    for (const locale of LOCALES) {
      const study = caseStudyBySlug("gatto", locale);
      expect(study?.live).toBe("https://gatto-psi.vercel.app");
      expect(study?.repo).toBeUndefined();
      const body = caseStudyBody("gatto", locale)!;
      expect(body).toContain("Silvia Galiano");
      expect(body).toContain("Vercel");
      expect(body).not.toMatch(/mailto:|tel:|wa\.me|github\.com|@/);
    }
    expect(caseStudyBody("gatto", "en")).toContain("no build step, runtime dependencies or trackers");
  });

  it("presents the FranCesc & Cescju redesign as an unadopted prototype, without contact details or source", () => {
    for (const locale of LOCALES) {
      const study = caseStudyBySlug("francesc-cescju", locale);
      expect(study?.live).toBe("https://cescju-prototype.vercel.app");
      expect(study?.repo).toBeUndefined();
      const body = caseStudyBody("francesc-cescju", locale)!;
      expect(body).toContain("Sant Hilari Sacalm");
      expect(body).toContain("francesc-cescju.eu");
      expect(body).not.toMatch(/mailto:|tel:|wa\.me|github\.com|@|630/);
    }
    expect(caseStudyBody("francesc-cescju", "en")).toContain("not been adopted");
  });

  it("returns undefined for an unknown slug or a locale with no file", () => {
    expect(caseStudyBySlug("does-not-exist", "en")).toBeUndefined();
  });
});
