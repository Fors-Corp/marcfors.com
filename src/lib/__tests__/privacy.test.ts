import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { careerBreak, contact, copy, education, experience, languages } from "@/data/copy";
import { caseStudyBySlug, listCaseStudySlugs } from "@/data/caseStudies";
import { featured, lab } from "@/data/projects";
import { LOCALES } from "@/lib/locale";
import {
  BANNED_PHONE_PATTERNS,
  BANNED_PUBLIC_PATTERNS,
  CV_PATH,
  DEV_EMAIL,
  SITE_HOST,
  SITE_REPO,
  SITE_URL,
} from "@/lib/site";
// The published-asset scanner CI runs, imported rather than reimplemented so a
// gap here is a gap there. scripts/check-privacy.mjs is a thin CLI over it.
import { ascii85, pdfText } from "../../../scripts/lib/pdf.mjs";
import { scanPublicAssets } from "../../../scripts/lib/privacy.mjs";

const repoRoot = path.resolve(__dirname, "../../..");
const cvFile = path.join(repoRoot, "public", CV_PATH.replace(/^\//, ""));

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

describe("published CV asset", () => {
  it("ships the PDF the site links to", () => {
    expect(existsSync(cvFile), `missing ${cvFile}`).toBe(true);
  });

  it("shows the developer mailbox, not a personal one", () => {
    const text = pdfText(cvFile);
    expect(text).toContain(DEV_EMAIL);
    expect(text).not.toMatch(/@gmail\.com/i);
  });

  it("carries no phone number (AGENTS.md keeps it off the site)", () => {
    const text = pdfText(cvFile);
    for (const pattern of BANNED_PHONE_PATTERNS) {
      expect(text, `phone pattern ${pattern}`).not.toMatch(pattern);
    }
  });

  it("passes every pattern the source scan enforces", () => {
    const text = pdfText(cvFile);
    for (const pattern of BANNED_PUBLIC_PATTERNS) {
      expect(text).not.toMatch(pattern);
    }
  });

  it("leaves public/ clean as a whole", () => {
    expect(scanPublicAssets(path.join(repoRoot, "public"))).toEqual([]);
  });
});

describe("published-asset scanner", () => {
  // Regression: the first cut of this scanner only tried inflate, so an
  // /ASCII85Decode + /FlateDecode stream decoded to nothing and a PDF holding a
  // phone number in plain sight scanned clean. A guard that cannot fail is
  // worse than none, so pin the decoding it depends on.
  it("decodes ASCII85, the filter that hid a leak", () => {
    expect(ascii85("87cURD]i,\"Ebo80").toString("latin1")).toBe("Hello World!");
    expect(ascii85("<~87cURD]i,\"Ebo80~>").toString("latin1")).toBe("Hello World!");
    // z is the all-zeros shorthand
    expect([...ascii85("z")]).toEqual([0, 0, 0, 0]);
  });

  it("recovers text from inside the shipped PDF’s compressed streams", () => {
    // Proves the scan reads stream contents, not just the raw bytes: this
    // string exists nowhere in the file until a stream is decoded.
    const raw = readFileSync(cvFile, "latin1");
    expect(raw).not.toContain(DEV_EMAIL);
    expect(pdfText(cvFile)).toContain(DEV_EMAIL);
  });
});
