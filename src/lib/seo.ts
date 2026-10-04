import type { CaseStudy } from "@/data/caseStudies";
import { copy } from "@/data/copy";
import { localeUrl, type Locale } from "@/lib/locale";
import { DEV_EMAIL, GITHUB_ORG_URL, GITHUB_URL, LINKEDIN_URL, RELEASE_DATE, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Structured data for search engines. One `Person` entity, addressed by a
 * stable `@id`, is what lets Google merge the home page, the case studies and
 * the off-site profiles (`sameAs`) into a single "Marc Fors" knowledge-graph
 * node. Every other node here points at that id instead of repeating it.
 */
export const GIVEN_NAME = "Marc";
export const FAMILY_NAME = "Fors";
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
/** The OG image route is static, so the unhashed URL resolves. */
export const PORTRAIT_URL = `${SITE_URL}/opengraph-image`;

/** The role phrasings recruiters and search engines use for the same job. */
export const OCCUPATIONS = ["AI Software Engineer", "LLM Engineer", "AI Agent Engineer"] as const;

/** Topics the site should rank for; mirrored in visible copy, never only here. */
export const KNOWS_ABOUT = [
  "LLM agents",
  "Agentic coding",
  "Claude Code",
  "Claude Agent SDK",
  "Model Context Protocol (MCP)",
  "Prompt engineering",
  "Retrieval-augmented generation (RAG)",
  "React",
  "TypeScript",
  "Go",
  "Next.js",
  "Observability",
] as const;

// Facts below follow the CV (source of truth, see AGENTS.md).
const ALUMNI_OF = ["Universitat Oberta de Catalunya", "Institut Joan d’Àustria", "Institut Escola del Treball"] as const;
const KNOWS_LANGUAGE = ["es", "ca", "en", "it"] as const;

const BARCELONA = { "@type": "City", name: "Barcelona" } as const;

function person(locale: Locale) {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_NAME,
    givenName: GIVEN_NAME,
    familyName: FAMILY_NAME,
    url: localeUrl(locale, "/", SITE_URL),
    image: PORTRAIT_URL,
    email: DEV_EMAIL,
    jobTitle: OCCUPATIONS[0],
    hasOccupation: OCCUPATIONS.map((name) => ({ "@type": "Occupation", name, occupationLocation: BARCELONA })),
    worksFor: { "@type": "Organization", name: "Fors Corp", url: GITHUB_ORG_URL },
    address: { "@type": "PostalAddress", addressLocality: "Barcelona", addressCountry: "ES" },
    sameAs: [GITHUB_URL, GITHUB_ORG_URL, LINKEDIN_URL],
    knowsAbout: [...KNOWS_ABOUT],
    knowsLanguage: [...KNOWS_LANGUAGE],
    alumniOf: ALUMNI_OF.map((name) => ({ "@type": "EducationalOrganization", name })),
    seeks: "AI engineering and LLM-agent roles in Barcelona or remote EU",
  };
}

function webSite(locale: Locale) {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: locale,
    publisher: { "@id": PERSON_ID },
  };
}

/** Rendered by the `[locale]` layout, so it is on every indexable page. */
export function siteJsonLd(locale: Locale) {
  return { "@context": "https://schema.org", "@graph": [webSite(locale), person(locale)] };
}

/** Home page only: Google's profile-page markup, pointing at the shared Person. */
export function profilePageJsonLd(locale: Locale) {
  const url = localeUrl(locale, "/", SITE_URL);
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    name: copy[locale].metaTitle,
    description: copy[locale].metaDescription,
    inLanguage: locale,
    dateModified: RELEASE_DATE,
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": PERSON_ID },
  };
}

/** Case-study page: breadcrumb trail plus the work itself, authored by the Person. */
export function caseStudyJsonLd(locale: Locale, study: CaseStudy) {
  const home = localeUrl(locale, "/", SITE_URL);
  const url = localeUrl(locale, `/work/${study.slug}`, SITE_URL);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: home },
          { "@type": "ListItem", position: 2, name: study.project, item: url },
        ],
      },
      {
        "@type": study.repo ? "SoftwareSourceCode" : "CreativeWork",
        "@id": `${url}#work`,
        name: study.project,
        headline: `${study.project} — ${copy[locale].caseStudy}`,
        description: study.description,
        url,
        inLanguage: locale,
        keywords: study.stack.join(", "),
        author: { "@id": PERSON_ID },
        isPartOf: { "@id": WEBSITE_ID },
        ...(study.repo ? { codeRepository: study.repo } : {}),
        ...(study.live ? { sameAs: [study.live] } : {}),
      },
    ],
  };
}
