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
  it("never links source for private projects", () => {
    for (const project of featured) {
      if (project.private) {
        expect(project.repo, project.name).toBeUndefined();
      } else {
        expect(project.repo, project.name).toMatch(/^https:\/\/github.com\/marcfs31\//);
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
    expect(site?.repo).toBe("https://github.com/marcfs31/marcfors.com");
    expect(site?.live).toBe("https://marcfors.com");
    expect(site?.private).toBeFalsy();
    expect(site?.spotlight).toBe(true);
  });

  it("covers every locale on every project blurb", () => {
    for (const project of [...featured, ...lab]) {
      expect(Object.keys(project.blurb).sort(), project.name).toEqual(["ca", "de", "en", "es", "it", "pt"]);
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
