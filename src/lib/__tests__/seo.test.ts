import { describe, expect, it } from "vitest";
import { caseStudyBySlug, listCaseStudySlugs } from "@/data/caseStudies";
import { copy } from "@/data/copy";
import { LOCALES, localeUrl } from "@/lib/locale";
import { caseStudyJsonLd, KNOWS_ABOUT, OCCUPATIONS, PERSON_ID, profilePageJsonLd, siteJsonLd, WEBSITE_ID } from "@/lib/seo";
import { GITHUB_URL, LINKEDIN_URL, RELEASE_DATE, SITE_NAME, SITE_URL } from "@/lib/site";

type Node = Record<string, unknown>;
const nodeOf = (graph: { "@graph": Node[] }, type: string) => graph["@graph"].find((n) => n["@type"] === type);

describe("home metadata copy", () => {
  it.each(LOCALES)("%s title leads with the name and fits a SERP title", (locale) => {
    const { metaTitle, metaDescription } = copy[locale];
    expect(metaTitle.startsWith(SITE_NAME)).toBe(true);
    expect(metaTitle.length).toBeLessThanOrEqual(65);
    expect(metaTitle).toMatch(/LLM/);
    expect(metaDescription.length).toBeLessThanOrEqual(185);
    for (const term of [SITE_NAME, "LLM", "Claude Code", "MCP"]) expect(metaDescription).toContain(term);
  });
});

describe("site JSON-LD graph", () => {
  it.each(LOCALES)("%s links WebSite and Person through stable ids", (locale) => {
    const graph = siteJsonLd(locale);
    const site = nodeOf(graph, "WebSite")!;
    const person = nodeOf(graph, "Person")!;
    expect(site["@id"]).toBe(WEBSITE_ID);
    expect(site.publisher).toEqual({ "@id": PERSON_ID });
    expect(person["@id"]).toBe(PERSON_ID);
    expect(person.url).toBe(localeUrl(locale, "/", SITE_URL));
    expect(site.inLanguage).toBe(locale);
  });

  it("describes the person with the role phrasings and topics to rank for", () => {
    const person = nodeOf(siteJsonLd("en"), "Person")!;
    expect(person.name).toBe(SITE_NAME);
    expect(person.givenName).toBe("Marc");
    expect(person.familyName).toBe("Fors");
    expect((person.hasOccupation as Node[]).map((o) => o.name)).toEqual([...OCCUPATIONS]);
    expect(OCCUPATIONS).toContain("AI Software Engineer");
    expect(OCCUPATIONS).toContain("LLM Engineer");
    expect(person.knowsAbout).toEqual([...KNOWS_ABOUT]);
    expect(KNOWS_ABOUT).toContain("Claude Code");
    expect(KNOWS_ABOUT).toContain("Model Context Protocol (MCP)");
    expect(person.sameAs).toEqual(expect.arrayContaining([GITHUB_URL, LINKEDIN_URL]));
    // Privacy: the public mailbox only, never a phone or Gmail address.
    expect(JSON.stringify(person)).not.toMatch(/gmail|\+34|telephone/i);
  });
});

describe("profile page JSON-LD", () => {
  it.each(LOCALES)("%s points at the shared Person and the release date", (locale) => {
    const page = profilePageJsonLd(locale) as Node;
    expect(page["@type"]).toBe("ProfilePage");
    expect(page.mainEntity).toEqual({ "@id": PERSON_ID });
    expect(page.isPartOf).toEqual({ "@id": WEBSITE_ID });
    expect(page.url).toBe(localeUrl(locale, "/", SITE_URL));
    expect(page.name).toBe(copy[locale].metaTitle);
    expect(page.dateModified).toBe(RELEASE_DATE);
  });
});

describe("case study JSON-LD", () => {
  const slugs = listCaseStudySlugs();

  it.each(slugs)("%s has a two-step breadcrumb and an authored work node", (slug) => {
    const study = caseStudyBySlug(slug, "en")!;
    const graph = caseStudyJsonLd("en", study);
    const crumbs = nodeOf(graph, "BreadcrumbList")!.itemListElement as Node[];
    expect(crumbs.map((c) => c.position)).toEqual([1, 2]);
    expect(crumbs[0]).toMatchObject({ name: SITE_NAME, item: SITE_URL });
    expect(crumbs[1]).toMatchObject({ name: study.project, item: `${SITE_URL}/work/${slug}` });

    const work = graph["@graph"][1] as Node;
    expect(work["@type"]).toBe(study.repo ? "SoftwareSourceCode" : "CreativeWork");
    expect(work.author).toEqual({ "@id": PERSON_ID });
    expect(work.description).toBe(study.description);
    if (study.repo) expect(work.codeRepository).toBe(study.repo);
  });

  it("localizes the breadcrumb target", () => {
    const study = caseStudyBySlug(slugs[0], "de")!;
    const crumbs = nodeOf(caseStudyJsonLd("de", study), "BreadcrumbList")!.itemListElement as Node[];
    expect(crumbs[1].item).toBe(`${SITE_URL}/de/work/${slugs[0]}`);
  });
});
