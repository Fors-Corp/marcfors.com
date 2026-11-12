import { describe, expect, it } from "vitest";
import { featured, skipRepos } from "@/data/projects";
import { isListedRepo, type GhRepo } from "@/lib/github";

function repo(partial: Partial<GhRepo> & Pick<GhRepo, "name">): GhRepo {
  return {
    html_url: `https://github.com/marcfs31/${partial.name}`,
    description: "ok",
    language: "TypeScript",
    stargazers_count: 0,
    homepage: "https://example.vercel.app",
    pushed_at: "2026-01-01",
    fork: false,
    ...partial,
  };
}

describe("featured work", () => {
  it("features Gatto as a delivered storefront with a case study, without exposing source", () => {
    const gatto = featured.find((item) => item.name === "Gatto");
    expect(gatto).toMatchObject({
      stack: ["HTML5", "CSS3", "JavaScript"],
      live: "https://gatto-psi.vercel.app",
      caseStudy: "gatto",
      private: true,
      spotlight: true,
    });
    expect(gatto?.repo).toBeUndefined();
    expect(gatto?.blurb.en).toMatch(/Silvia Galiano/);
    expect(gatto?.blurb.en).toMatch(/Spanish, Catalan and English/);
  });

  it("features Embedded RAG first in selected work without linking private source", () => {
    expect(featured[0]?.name).toBe("Embedded RAG");
    const embedded = featured[0];
    expect(embedded).toMatchObject({
      stack: ["Python", "React", "TypeScript", "Neon", "Claude API"],
      live: "https://embedded-rag.vercel.app",
      caseStudy: "embedded-rag",
      private: true,
      spotlight: true,
    });
    expect(embedded?.repo).toBeUndefined();
    for (const blurb of Object.values(embedded!.blurb)) {
      expect(blurb).toMatch(/pgvector|MiniLM|Claude/);
      expect(blurb).toMatch(/RRF|híbrid|hibrid|ibrido|hybride|hybridem/i);
      expect(blurb).toMatch(/abstain|negativa|rifiuto|recusa|Ablehnung|refus/i);
      expect(blurb).not.toMatch(/public source|código público|codi públic|codice pubblico|código público|öffentlicher Quellcode|code source public/i);
    }
  });

  it("features Wordkeep second on its own domain, without exposing source", () => {
    expect(featured.findIndex((item) => item.name === "Wordkeep")).toBe(1);
    const wordkeep = featured.find((item) => item.name === "Wordkeep");
    expect(wordkeep).toMatchObject({
      stack: ["React", "TypeScript", "Three.js", "Hono", "Claude API"],
      live: "https://wordkeep.me",
      caseStudy: "wordkeep",
      private: true,
      spotlight: true,
    });
    expect(wordkeep?.repo).toBeUndefined();
    for (const blurb of Object.values(wordkeep!.blurb)) {
      expect(blurb).toMatch(/Claude/);
      expect(blurb).toMatch(/3D/);
      expect(blurb).toMatch(/App Store|App-Store/);
      // Live wordkeep.me ships eight course languages including Latin.
      expect(blurb).toMatch(/eight|ocho|vuit|otto|oito|acht|huit/);
      expect(blurb).toMatch(/Latin|latín|llatí|latino|latim|Latein|latin/);
      expect(blurb).not.toMatch(/seven languages|siete lenguas|set llengües|sette lingue|sete línguas|sieben Sprachen|sept langues/);
    }
  });

  it("features forscorp.es as live work, linking the site but never its private source", () => {
    const fors = featured.find((item) => item.name === "Fors Corp");
    expect(fors).toMatchObject({
      stack: ["Next.js 16", "React 19", "TypeScript"],
      live: "https://forscorp.es",
      caseStudy: "fors-corp",
      private: true,
      spotlight: true,
    });
    expect(fors?.repo).toBeUndefined();
    expect(fors?.blurb.en).toMatch(/Spanish, Catalan and English/);
    expect(fors?.blurb.en).toMatch(/no cookies or analytics/);
  });

  it("features the FranCesc & Cescju redesign as a prototype with a case study, never its private source", () => {
    const cescju = featured.find((item) => item.name === "FranCesc & Cescju");
    expect(cescju).toMatchObject({
      stack: ["HTML5", "CSS3", "JavaScript"],
      live: "https://cescju-prototype.vercel.app",
      caseStudy: "francesc-cescju",
      private: true,
      spotlight: true,
    });
    expect(cescju?.repo).toBeUndefined();
    for (const blurb of Object.values(cescju!.blurb)) {
      expect(blurb).toMatch(/Sant Hilari Sacalm/);
    }
    expect(cescju?.blurb.en).toMatch(/redesign prototype/);
  });

  it("features Fors Photography on forsphoto.com with a case study and no private source", () => {
    const photo = featured.find((item) => item.name === "Fors Photography");
    expect(photo).toMatchObject({
      stack: ["Next.js 16", "React 19", "Tailwind CSS", "Stripe"],
      live: "https://www.forsphoto.com",
      caseStudy: "fors-photography",
      private: true,
      spotlight: true,
    });
    expect(photo?.repo).toBeUndefined();
    for (const blurb of Object.values(photo!.blurb)) {
      expect(blurb).toMatch(/18/);
      expect(blurb).toMatch(/Stripe/);
      expect(blurb).toMatch(/forsphoto\.com/);
    }
    expect(photo?.blurb.en).toMatch(/four sizes/);
    expect(photo?.blurb.en).toMatch(/no database, accounts or analytics/);
  });

  it("features FerreTodo Lepant by its live site and case study, never its private source", () => {
    const shop = featured.find((item) => item.name === "FerreTodo Lepant");
    expect(shop).toMatchObject({
      stack: ["Next.js 16", "Tailwind CSS", "TypeScript"],
      live: "https://ferretodo-lepant.vercel.app",
      caseStudy: "ferretodo-lepant",
      private: true,
      spotlight: true,
    });
    expect(shop?.repo).toBeUndefined();
    for (const blurb of Object.values(shop!.blurb)) {
      expect(blurb).toMatch(/Lepant/);
      expect(blurb).toMatch(/WhatsApp/);
      expect(blurb).not.toMatch(/github\.com|672|@/);
    }
  });

  it("never links source for private projects", () => {
    const privateWithSource = featured.filter((p) => p.private && p.repo).map((p) => p.name);
    expect(privateWithSource).toEqual([]);
    for (const project of featured) {
      if (!project.private && project.repo) {
        expect(project.repo, project.name).toMatch(/^https:\/\/github\.com\/(marcfs31|Fors-Corp)\//);
      }
    }
  });

  it("gives Habit Breaker a live URL, a case study, and no repo", () => {
    const habit = featured.find((item) => item.name === "Habit Breaker");
    expect(habit?.live).toMatch(/^https:\/\//);
    expect(habit?.caseStudy).toBe("habit-breaker");
    expect(habit?.private).toBe(true);
    expect(habit?.repo).toBeUndefined();
  });

  it("lists iTerm Studio with public source, gallery, and a case study", () => {
    const studio = featured.find((item) => item.name === "iTerm Studio");
    expect(studio?.repo).toBe("https://github.com/Fors-Corp/iterm-studio");
    expect(studio?.live).toBe("https://fors-corp.github.io/iterm-studio/");
    expect(studio?.caseStudy).toBe("iterm-studio");
    expect(studio?.private).toBeFalsy();
    expect(studio?.spotlight).toBe(true);
  });

  it("does not list SmartGarden in selected work or the public-repo feed", () => {
    expect(featured.some((item) => item.name === "SmartGarden")).toBe(false);
    expect(skipRepos.has("SmartGarden")).toBe(true);
  });

  it("lists this atlas with public source, the live site, and a case study", () => {
    const site = featured.find((item) => item.name === "marcfors.com");
    expect(site?.repo).toBe("https://github.com/Fors-Corp/marcfors.com");
    expect(site?.live).toBe("https://marcfors.com");
    expect(site?.caseStudy).toBe("marcfors-com");
    expect(site?.private).toBeFalsy();
    expect(site?.spotlight).toBe(true);
  });

  it("lists LMaaS (not the old mlaas name) as a private spotlight with a case study and no repo", () => {
    expect(featured.some((item) => item.name === "mlaas")).toBe(false);
    const lmaas = featured.find((item) => item.name === "LMaaS");
    expect(lmaas?.private).toBe(true);
    expect(lmaas?.repo).toBeUndefined();
    expect(lmaas?.caseStudy).toBe("lmaas");
    expect(lmaas?.blurb.en).toMatch(/OpenAI-compatible API/);
  });

  it("lists forsight as a private spotlight with a live Pages site and no source link", () => {
    const forsight = featured.find((item) => item.name === "forsight");
    expect(forsight).toMatchObject({
      live: "https://fors-corp.github.io/forsight/",
      caseStudy: "forsight",
      private: true,
      spotlight: true,
    });
    expect(forsight?.repo).toBeUndefined();
    expect(forsight?.blurb.en).toMatch(/observability platform/i);
  });

  it("points Fors Design System at the org repo and Pages site", () => {
    const item = featured.find((project) => project.name === "Fors Design System");
    expect(item?.repo).toMatch(/^https:\/\/github\.com\/Fors-Corp\//);
    expect(item?.live).toMatch(/^https:\/\/fors-corp\.github\.io\//);
    expect(item?.caseStudy).toBe("fors-design-system");
  });

  it("gives every spotlight product a case study except fileshelf", () => {
    for (const project of featured.filter((item) => item.spotlight)) {
      if (project.name === "fileshelf") {
        expect(project.caseStudy).toBeUndefined();
        continue;
      }
      expect(project.caseStudy, project.name).toBeTruthy();
    }
  });

  it("covers every locale on every project blurb", () => {
    for (const project of featured) {
      expect(Object.keys(project.blurb).sort(), project.name).toEqual(["ca", "de", "en", "es", "fr", "it", "pt"]);
    }
  });

  it("does not claim a current Dynatrace role in project blurbs", () => {
    const blob = featured.map((item) => Object.values(item.blurb).join("\n")).join("\n");
    expect(blob).not.toMatch(/now ships React at Dynatrace/i);
    expect(blob).not.toMatch(/currently at Dynatrace/i);
  });
});

describe("public repo listing", () => {
  it("drops forks, homework names, and empty shells", () => {
    expect(isListedRepo(repo({ name: "fileshelf" }))).toBe(true);
    expect(isListedRepo(repo({ name: "TicketApp" }))).toBe(false);
    expect(isListedRepo(repo({ name: "fileshelf", fork: true }))).toBe(false);
    expect(isListedRepo(repo({ name: "gifs-app", description: null, language: null }))).toBe(false);
  });

  it("only auto-lists repos that serve something live", () => {
    expect(isListedRepo(repo({ name: "hyper-top", homepage: null }))).toBe(false);
    expect(isListedRepo(repo({ name: "hyper-top", homepage: "" }))).toBe(false);
    expect(isListedRepo(repo({ name: "forsight", homepage: "https://marcfs31.github.io/forsight/" }))).toBe(
      true,
    );
  });

  it("keeps the homework skip list populated", () => {
    expect(skipRepos.has("TicketApp")).toBe(true);
    expect(skipRepos.has("my-portfolio")).toBe(true);
    expect(skipRepos.has("learning-spring")).toBe(true);
    expect(skipRepos.has(".github")).toBe(true);
    expect(skipRepos.has("demo-repository")).toBe(true);
    expect(skipRepos.has("claude-code-guidelines")).toBe(true);
  });
});
