import { describe, expect, it } from "vitest";
import { caseStudyBody, caseStudyBySlug, listCaseStudySlugs } from "@/data/caseStudies";
import { LOCALES } from "@/lib/locale";

describe("case studies", () => {
  it("lists every case study, sorted by order", () => {
    const slugs = listCaseStudySlugs();
    expect(slugs).toEqual([
      "embedded-rag",
      "fors-photography",
      "kevin-ai",
      "mensura",
      "wordkeep",
      "marcfors-com",
      "gatto",
      "francesc-cescju",
      "fors-corp",
      "ferretodo-lepant",
      "iterm-studio",
      "finance-dashboard",
      "lmaas",
      "forsight",
      "fors-design-system",
      "meditateit",
    ]);
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

  it("documents Embedded RAG with live demo, private source and hybrid classic RAG facts", () => {
    for (const locale of LOCALES) {
      const study = caseStudyBySlug("embedded-rag", locale);
      expect(study?.live).toBe("https://embedded-rag.vercel.app");
      expect(study?.repo).toBeUndefined();
      expect(study?.stack).toEqual(["Python", "React", "TypeScript", "Neon", "Claude API"]);
      expect(study?.order).toBe(-1);
      const body = caseStudyBody("embedded-rag", locale)!;
      for (const fact of [
        "pgvector",
        "Claude",
        "MiniLM",
        "Reciprocal Rank Fusion",
        "The answer is not in the documents.",
      ]) {
        expect(body, `${locale}: ${fact}`).toContain(fact);
      }
      expect(body, `${locale}: Vercel Blob`).toMatch(/Vercel[ -]?Blob/);
      expect(body).toMatch(/paraphrase-multilingual|multilingual MiniLM|MiniLM multiling/i);
      expect(body).not.toMatch(/github\.com|public source|código público|codi públic|codice pubblico|öffentlicher Quellcode|code source public/i);
      expect(body).not.toMatch(/@gmail\.com|mailto:|tel:/i);
    }
  });

  it("documents Wordkeep's current product on its own domain, without linking its private source", () => {
    for (const locale of LOCALES) {
      const study = caseStudyBySlug("wordkeep", locale);
      expect(study?.live).toBe("https://wordkeep.me");
      expect(study?.repo).toBeUndefined();
      expect(study?.stack).toEqual(expect.arrayContaining(["Three.js", "Hono", "Claude API"]));
      const body = caseStudyBody("wordkeep", locale)!;
      expect(study?.description ?? body).toMatch(/App Store/i);
      for (const fact of ["Claude", "SM-2", "IndexedDB", "AES-GCM", "PBKDF2", "Three.js", "200", "30"]) {
        expect(body, `${locale}: ${fact}`).toContain(fact);
      }
      expect(body, `${locale}: CEFR`).toMatch(/A1.{0,8}C2/);
      expect(body, `${locale}: Latin`).toMatch(/Latin|latín|llatí|latino|latim|Latein|latin/);
      expect(body).not.toMatch(/A1 to C1|A1 a C1|A1 à C1|A1 bis C1|d’A1 a C1|da A1 a C1/);
      expect(body).not.toMatch(/github\.com|vercel\.app|@gmail\.com|mailto:|tel:/i);
    }
  });

  it("documents kevin-ai with its public source, measured speeds and verification, in every locale", () => {
    for (const locale of LOCALES) {
      const study = caseStudyBySlug("kevin-ai", locale);
      expect(study?.repo).toBe("https://github.com/marcfs31/kevin-ai");
      expect(study?.live).toBeUndefined();
      expect(study?.stack).toEqual(["C99", "AVX2", "Python", "Vite", "React", "TypeScript"]);
      const body = caseStudyBody("kevin-ai", locale)!;
      for (const fact of ["Qwen3.5-4B", "Gemma 4 E4B", "float64", "Apache-2.0", "800 MHz", "5e-9", "1,35|1\\.35", "Vite", "React", "TypeScript", "Lighthouse"]) {
        expect(body, `${locale}: ${fact}`).toMatch(new RegExp(fact));
      }
      expect(body).not.toMatch(/@gmail\.com|mailto:|tel:/i);
    }
  });

  it("documents MeditateIt's local-first PWA with its live site and public source, without medical claims", () => {
    for (const locale of LOCALES) {
      const study = caseStudyBySlug("meditateit", locale);
      expect(study?.live).toBe("https://marcfs31.github.io/MeditateIt/");
      expect(study?.repo).toBe("https://github.com/marcfs31/MeditateIt");
      const body = caseStudyBody("meditateit", locale)!;
      for (const fact of ["Web Audio", "localStorage", "AudioWorklet", "CSP"]) {
        expect(body, `${locale}: ${fact}`).toContain(fact);
      }
      expect(body).not.toMatch(/Fors-Corp|@gmail\.com|mailto:|tel:/i);
    }
  });

  it("documents Mensura's locally learned, history-validated forecast without linking its private source", () => {
    for (const locale of LOCALES) {
      const study = caseStudyBySlug("mensura", locale);
      expect(study?.live).toBe("https://mensura.cc");
      expect(study?.repo).toBeUndefined();
      const body = caseStudyBody("mensura", locale)!;
      expect(body).toContain("180");
      expect(body).toContain("localStorage");
      expect(body).not.toMatch(/github\.com|@gmail\.com|mailto:|tel:/i);
    }
    const english = caseStudyBody("mensura", "en")!;
    expect(english).toContain("gradient-boosted trees");
    expect(english).toContain("Monte Carlo");
    expect(english).toContain("clinical predictor");
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


  it("documents Fors Photography without linking private source", () => {
    for (const locale of LOCALES) {
      const study = caseStudyBySlug("fors-photography", locale);
      expect(study?.live).toBe("https://www.forsphoto.com");
      expect(study?.repo).toBeUndefined();
      const body = caseStudyBody("fors-photography", locale)!;
      expect(body).toContain("18");
      expect(body).toContain("Stripe");
      expect(body).not.toMatch(/github\.com|@gmail\.com|mailto:|tel:/i);
    }
  });

  it("documents marcfors.com with public source", () => {
    const study = caseStudyBySlug("marcfors-com", "en");
    expect(study?.repo).toBe("https://github.com/Fors-Corp/marcfors.com");
    expect(study?.live).toBe("https://marcfors.com");
  });

  it("names the fonts the homepage ships", () => {
    for (const locale of LOCALES) {
      const body = caseStudyBody("marcfors-com", locale)!;
      expect(body, locale).toContain("Spectral");
      expect(body, locale).toContain("Manrope");
      expect(body, locale).not.toMatch(/Fraunces|IBM Plex Mono/);
    }
  });

  it("keeps private product studies free of repo URLs", () => {
    for (const slug of [
      "embedded-rag",
      "fors-corp",
      "ferretodo-lepant",
      "finance-dashboard",
      "lmaas",
      "forsight",
    ]) {
      expect(caseStudyBySlug(slug, "en")?.repo, slug).toBeUndefined();
    }
  });

  it("publishes Fors Design System with public source and Pages", () => {
    const study = caseStudyBySlug("fors-design-system", "en");
    expect(study?.repo).toBe("https://github.com/Fors-Corp/fors-design-system");
    expect(study?.live).toBe("https://fors-corp.github.io/fors-design-system/");
  });

  it("returns undefined for an unknown slug or a locale with no file", () => {
    expect(caseStudyBySlug("does-not-exist", "en")).toBeUndefined();
  });
});
