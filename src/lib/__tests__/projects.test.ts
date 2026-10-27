import { describe, expect, it } from "vitest";
import { featured, lab, skipRepos } from "@/data/projects";
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

  it("features Wordkeep right after Mensura, on its own domain, without exposing source", () => {
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
    }
  });

  it("features forscorp.es as live work, linking the site but never its private source", () => {
    const fors = featured.find((item) => item.name === "Fors Corp");
    expect(fors).toMatchObject({
      stack: ["Next.js 16", "React 19", "TypeScript"],
      live: "https://forscorp.es",
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

  it("features Fors Photography as a live print shop, linking the store but never its private source", () => {
    const photo = featured.find((item) => item.name === "Fors Photography");
    expect(photo).toMatchObject({
      stack: ["Next.js 16", "React 19", "Stripe"],
      live: "https://fors-photography.vercel.app",
      private: true,
      spotlight: true,
    });
    expect(photo?.repo).toBeUndefined();
    expect(photo?.caseStudy).toBeUndefined();
    for (const blurb of Object.values(photo!.blurb)) {
      expect(blurb).toMatch(/18/);
      expect(blurb).toMatch(/Stripe/);
    }
    expect(photo?.blurb.en).toMatch(/no database, accounts or analytics/);
  });

  it("features FerreTodo Lepant by its live site and its private repository", () => {
    const shop = featured.find((item) => item.name === "FerreTodo Lepant");
    expect(shop).toMatchObject({
      stack: ["Next.js 16", "Tailwind CSS", "TypeScript"],
      live: "https://ferretodo-lepant.vercel.app",
      repo: "https://github.com/marcfs31/ferretodo-lepant",
      private: true,
      spotlight: true,
    });
    for (const blurb of Object.values(shop!.blurb)) {
      expect(blurb).toMatch(/Lepant/);
      expect(blurb).toMatch(/WhatsApp/);
      expect(blurb).not.toMatch(/github\.com|672|@/);
    }
  });

  it("links source for private projects only where Marc opted in", () => {
    const privateWithSource = featured.filter((p) => p.private && p.repo).map((p) => p.name);
    expect(privateWithSource).toEqual(["FerreTodo Lepant"]);
    for (const project of featured) {
      if (!project.private) {
        expect(project.repo, project.name).toMatch(/^https:\/\/github.com\/(marcfs31|Fors-Corp)\//);
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
    expect(studio?.repo).toBe("https://github.com/marcfs31/iterm-studio");
    expect(studio?.live).toBe("https://marcfs31.github.io/iterm-studio/");
    expect(studio?.caseStudy).toBe("iterm-studio");
    expect(studio?.private).toBeFalsy();
    expect(studio?.spotlight).toBe(true);
  });

  it("does not list SmartGarden in selected work or the public-repo feed", () => {
    expect(featured.some((item) => item.name === "SmartGarden")).toBe(false);
    expect(skipRepos.has("SmartGarden")).toBe(true);
  });

  it("lists this desk with public source and the live site", () => {
    const site = featured.find((item) => item.name === "marcfors.com");
    expect(site?.repo).toBe("https://github.com/Fors-Corp/marcfors.com");
    expect(site?.live).toBe("https://marcfors.com");
    expect(site?.private).toBeFalsy();
    expect(site?.spotlight).toBe(true);
  });

  it("lists LMaaS (not the old mlaas name) as a private spotlight with no repo", () => {
    expect(featured.some((item) => item.name === "mlaas")).toBe(false);
    const lmaas = featured.find((item) => item.name === "LMaaS");
    expect(lmaas?.private).toBe(true);
    expect(lmaas?.repo).toBeUndefined();
    expect(lmaas?.blurb.en).toMatch(/OpenAI-compatible API/);
  });

  it("points the Fors-Corp products at the org repos and their org Pages sites", () => {
    for (const name of ["forsight", "Fors Design System"]) {
      const item = featured.find((project) => project.name === name);
      expect(item?.repo, name).toMatch(/^https:\/\/github.com\/Fors-Corp\//);
      expect(item?.live, name).toMatch(/^https:\/\/fors-corp.github.io\//);
    }
    expect(featured.find((item) => item.name === "forsight")?.blurb.en).toMatch(/observability platform/i);
  });

  it("covers every locale on every project blurb", () => {
    for (const project of [...featured, ...lab]) {
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
  });
});
