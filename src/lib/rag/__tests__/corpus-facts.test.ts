import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { careerBreak, education, experience, languages, skills } from "@/data/copy";
import { featured, type Project } from "@/data/projects";
import { contextCoversQuestion, escapeIlike, significantTokens } from "@/lib/rag/lexical";
import { DEV_EMAIL, LINKEDIN_URL } from "@/lib/site";

const CORPUS = path.join(process.cwd(), "corpus");

function readCorpus(relative: string): string {
  return readFileSync(path.join(CORPUS, relative), "utf8");
}

function walkMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkMarkdown(full));
      continue;
    }
    if (entry.name === "ATTRIBUTION") continue;
    if (/\.(md|txt)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

/** Case-study slug when the site has one; otherwise a stable kebab of the name. */
function corpusSlug(project: Pick<Project, "name" | "caseStudy">): string {
  if (project.caseStudy) return project.caseStudy;
  return project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

describe("public portfolio facts in the Ask corpus", () => {
  it("keeps who Marc is, where he is based, and remote availability", () => {
    const about = readCorpus("about.md");
    expect(about).toMatch(/AI software engineer/i);
    expect(about).toMatch(/Barcelona, Spain/);
    expect(about).toMatch(/EU citizen/);
    expect(about).toMatch(/Open to remote roles/i);
    expect(about).toMatch(/Available now/i);
    expect(about).toContain(DEV_EMAIL);
    expect(about).toContain(languages.en);
    expect(about).toMatch(/Fors Corp/);
    expect(about).toMatch(/Dynatrace ended November 2025/);
    expect(about).toMatch(/Do not say “currently at Dynatrace”/);
    expect(about).not.toMatch(/Italian \(intermediate\)/);
  });

  it("copies the public education lines", () => {
    const body = readCorpus("education.md");
    expect(body).toMatch(/Places of study for Marc Fors/);
    for (const line of education.en) {
      expect(body).toContain(line);
    }
  });

  it("keeps employment dates and the independent-practice window", () => {
    const body = readCorpus("experience.md");
    expect(body).toContain(careerBreak.en.when);
    expect(body).toContain(experience.en[0]!.org);
    expect(body).toContain(experience.en[0]!.when);
    expect(body).toContain(experience.en[1]!.org);
    expect(body).toContain(experience.en[2]!.org);
    expect(body).toMatch(/Open to remote roles/i);
    expect(body).toMatch(/AI Software Engineer/);
  });

  it("lists the public skill groups", () => {
    const body = readCorpus("skills.md");
    for (const group of Object.values(skills)) {
      for (const skill of group) {
        expect(body).toContain(skill);
      }
    }
  });

  it("explains how to hire or contact using only public addresses", () => {
    const contact = readCorpus("contact.md");
    expect(contact).toContain(DEV_EMAIL);
    expect(contact).toContain(LINKEDIN_URL);
    expect(contact).toContain("https://github.com/marcfs31");
    expect(contact).toContain("https://github.com/Fors-Corp");
    expect(contact).toMatch(/Recruiters with an AI or frontend role/i);
    expect(contact).toMatch(/custom app/i);
    expect(contact).toMatch(/Barcelona or remote EU/);
    expect(contact).toContain("https://marcfors.com/marc-fors-cv.pdf");
    expect(contact).toMatch(/no phone number/i);
    expect(contact).toMatch(/Support · 1,99 €/);

    const privacy = readCorpus("privacy.md");
    expect(privacy).toContain(DEV_EMAIL);
    expect(privacy).toMatch(/no phone number/i);
    expect(privacy).toMatch(/marcfors-locale/);
    expect(privacy).toContain("https://marcfors.com/privacy");

    const trace = readCorpus("trace-theater.md");
    expect(trace).toContain("Trace Theater");
    expect(trace).toMatch(/OpenTelemetry/i);
    expect(trace).toContain("https://marcfors.com/lab/trace");
  });

  it("indexes every featured project, with a stable work page", () => {
    const index = readCorpus("projects.md");
    for (const project of featured) {
      expect(index, project.name).toContain(project.name);
      if (project.live) expect(index, project.name).toContain(project.live);
      if (project.repo) expect(index, project.name).toContain(project.repo);
      // Projects without a case-study page stay out of work/ so citations do not
      // point at a /work/<slug> route that does not exist.
      const page = readCorpus(
        project.caseStudy
          ? path.join("work", `${corpusSlug(project)}.md`)
          : path.join("projects", `${corpusSlug(project)}.md`),
      );
      expect(page, project.name).toContain(project.name);
      if (project.live) expect(page, project.name).toContain(project.live);
      if (project.repo) expect(page, project.name).toContain(project.repo);
    }
  });

  it("still lets retrieval helpers tell a covering chunk from an unrelated one", () => {
    expect(escapeIlike("a_b%")).toBe("a\\_b\\%");
    expect(significantTokens("Where is Marc based?")).toEqual(["Marc", "based"]);
    expect(significantTokens("How can I hire Marc?")).toEqual(["hire", "Marc"]);

    const about = readCorpus("about.md");
    const educationBody = readCorpus("education.md");
    const contact = readCorpus("contact.md");
    const fileshelf = readCorpus("projects/fileshelf.md");

    expect(contextCoversQuestion(about, "What languages does Marc speak?")).toBe(true);
    expect(contextCoversQuestion(about, "Is Marc open to remote roles?")).toBe(true);
    expect(contextCoversQuestion(about, "Where is Marc based?")).toBe(true);
    expect(contextCoversQuestion(educationBody, "Where did Marc study?")).toBe(true);
    expect(contextCoversQuestion(contact, "How can I hire Marc?")).toBe(true);
    expect(contextCoversQuestion(fileshelf, "What is fileshelf?")).toBe(true);
    expect(contextCoversQuestion("Marc builds design systems.", "What languages does Marc speak?")).toBe(
      false,
    );
    expect(contextCoversQuestion(about, "Where did Marc study?")).toBe(false);
  });

  it("does not add a phone number, a Gmail address, or the old host", () => {
    for (const file of walkMarkdown(CORPUS)) {
      const body = readFileSync(file, "utf8");
      const label = path.relative(CORPUS, file);
      expect(body, label).not.toMatch(/@gmail\.com/i);
      expect(body, label).not.toMatch(/marcfors\.me/i);
      expect(body, label).not.toMatch(/\+34\b/);
    }
  });
});
