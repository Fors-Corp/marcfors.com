import { describe, expect, it } from "vitest";
import { GET } from "@/app/llms.txt/route";
import { GET as GET_FULL } from "@/app/llms-full.txt/route";
import { listCaseStudySlugs } from "@/data/caseStudies";
import { llmsFullTxt, llmsTxt } from "@/lib/llms";
import { LOCALES, localeUrl } from "@/lib/locale";
import { SITE_URL } from "@/lib/site";

describe("llms.txt", () => {
  it("states the photography case study, every locale, and never a private repo", () => {
    const text = llmsTxt();
    expect(text).toContain("https://marcfors.com/work/fors-photography");
    expect(text).toContain("forsphoto.com");
    expect(text).not.toContain("https://github.com/Fors-Corp/fors-photography");
    expect(text).toContain("developer@marcfors.com");
    for (const locale of LOCALES) {
      expect(text).toContain(localeUrl(locale, "/", SITE_URL));
    }
    expect(text).not.toMatch(/gmail|\+34/i);
  });

  it("answers as plain text", async () => {
    const response = GET();
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toContain("# Marc Fors");
  });

  it("states experience with Fors Corp as the current role and no stale Dynatrace claim", () => {
    const text = llmsTxt();
    expect(text).toContain("Dec 2025 — present: AI Software Engineer, Fors Corp");
    expect(text).toContain("May 2022 — Nov 2025: Software Engineer, Dynatrace");
    expect(text).not.toMatch(/currently at Dynatrace/i);
    expect(text).toContain("## Education and languages");
  });

  it("links every case study and the full-text companion", () => {
    const text = llmsTxt();
    expect(text).toMatch(/## Optional\n- \[Full text\]\(https:\/\/marcfors\.com\/llms-full\.txt\)/);
    for (const slug of listCaseStudySlugs()) expect(text).toContain(`https://marcfors.com/work/${slug}`);
  });
});

describe("llms-full.txt", () => {
  it("inlines every case study body under demoted headings and keeps the privacy rules", async () => {
    const text = llmsFullTxt();
    for (const slug of listCaseStudySlugs()) expect(text).toContain(`- Page: https://marcfors.com/work/${slug}`);
    expect(text).toContain("### Embedded RAG");
    expect(text).toContain("#### Problem");
    expect(text).not.toMatch(/^## Problem/m);
    expect(text).toContain("- Languages:");
    expect(text).not.toContain("https://github.com/Fors-Corp/fors-photography");
    expect(text).not.toMatch(/gmail|\+34|marcfors\.me/i);
    const response = GET_FULL();
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toBe(text);
  });
});
