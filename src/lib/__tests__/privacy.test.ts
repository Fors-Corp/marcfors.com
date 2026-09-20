import { describe, expect, it } from "vitest";
import { careerBreak, contact, copy, education, experience, languages } from "@/data/copy";
import { caseStudyBySlug, listCaseStudySlugs } from "@/data/caseStudies";
import { featured, lab } from "@/data/projects";
import { LOCALES } from "@/lib/locale";
import { BANNED_PUBLIC_PATTERNS, DEV_EMAIL, SITE_HOST, SITE_REPO, SITE_URL } from "@/lib/site";

// Case-study prose itself lives in content/**/*.mdx, outside any TS import —
// scripts/check-privacy.mjs greps that directory directly. This corpus still
// carries every case study's frontmatter (project/stack/live/repo/description)
// for every locale, for defense in depth.
const caseStudyFrontmatter = listCaseStudySlugs().flatMap((slug) =>
  LOCALES.map((locale) => caseStudyBySlug(slug, locale)),
);

function corpus(): string {
  return JSON.stringify({
    copy,
    contact,
    careerBreak,
    education,
    experience,
    languages,
    featured,
    lab,
    caseStudyFrontmatter,
    SITE_HOST,
    SITE_URL,
    SITE_REPO,
    DEV_EMAIL,
  });
}

describe("public surface privacy", () => {
  it("uses the developer mailbox, never a gmail address", () => {
    expect(contact.email).toBe(DEV_EMAIL);
    expect(contact.email.endsWith(`@${SITE_HOST}`)).toBe(true);
    expect(corpus()).not.toMatch(/@gmail\.com/i);
  });

  it("is hosted on marcfors.com", () => {
    expect(SITE_HOST).toBe("marcfors.com");
    expect(SITE_URL).toBe("https://marcfors.com");
    expect(SITE_REPO).toBe("https://github.com/Fors-Corp/marcfors.com");
    expect(copy.en.footer).toContain(SITE_HOST);
    expect(copy.es.footer).toContain(SITE_HOST);
    expect(copy.en.hireSubject).toContain(SITE_HOST);
    expect(copy.en.buildSubject).toContain(SITE_HOST);
    expect(corpus()).not.toMatch(/marcfors\.me/i);
  });

  it("does not put a phone number in shipped copy", () => {
    expect(contact).not.toHaveProperty("phone");
    expect(corpus()).not.toMatch(/\+34/);
    expect(corpus()).not.toMatch(/\b\d{3}\s\d{2}\s\d{2}\s\d{2}\b/);
  });

  it("flags the same patterns the CI privacy scan uses", () => {
    const text = corpus();
    for (const pattern of BANNED_PUBLIC_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });
});
