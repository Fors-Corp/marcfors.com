import type { Metadata } from "next";
import type { CaseStudy } from "@/data/caseStudies";
import { copy } from "@/data/copy";
import { featured } from "@/data/projects";
import { LOCALES, localeUrl, OG_LOCALES, type Locale } from "@/lib/locale";
import { OG_SIZE, OG_TYPE } from "@/lib/og";
import {
  CV_PATH,
  DEV_EMAIL,
  GITHUB_ORG_URL,
  GITHUB_URL,
  LINKEDIN_URL,
  PRIVACY_UPDATED,
  RELEASE_DATE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

/**
 * Structured data for search engines. One `Person` entity, addressed by a
 * stable `@id`, is what lets Google merge the home page, the case studies and
 * the off-site profiles (`sameAs`) into a single "Marc Fors" knowledge-graph
 * node. Every other node here points at that id instead of repeating it.
 */
/**
 * `dateModified` wants a full ISO 8601 datetime with a time zone: Google's
 * Rich Results Test flags a date-only value ("2026-10-04") as an invalid
 * datetime. The site tracks dates as `YYYY-MM-DD`, so stamp them at UTC midnight.
 */
export function isoDateTime(date: string): string {
  return `${date}T00:00:00Z`;
}

export const GIVEN_NAME = "Marc";
export const FAMILY_NAME = "Fors";
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
/** The OG image route is static, so the unhashed URL resolves. */
export const PORTRAIT_URL = `${SITE_URL}/opengraph-image`;

/** The role phrasings recruiters and search engines use for the same job. */
export const OCCUPATIONS = ["AI Software Engineer", "LLM Engineer", "AI Agent Engineer"] as const;

/**
 * One robots policy for every crawler. The generic tag is what Bing, DuckDuckGo
 * (via Bing), Yandex and the rest read; `googleBot` repeats it because Google
 * prefers its own meta name when both are present. `-1` means no snippet cap.
 */
const PREVIEW_ROBOTS = {
  index: true,
  follow: true,
  "max-image-preview": "large" as const,
  "max-snippet": -1,
  "max-video-preview": -1,
};

export const CRAWL_ROBOTS: Metadata["robots"] = {
  ...PREVIEW_ROBOTS,
  googleBot: { ...PREVIEW_ROBOTS },
};

type PageSocialMetadataOptions = {
  locale: Locale;
  title: string;
  description: string;
  url: string;
  type?: "article" | "profile" | "website";
  authors?: string[];
};

/** Re-declare complete social cards on leaf pages because Next merges metadata shallowly. */
export function pageSocialMetadata({
  locale,
  title,
  description,
  url,
  type = "website",
  authors,
}: PageSocialMetadataOptions): Pick<Metadata, "openGraph" | "twitter"> {
  const imageAlt = `${SITE_NAME} — ${OCCUPATIONS[0]}`;
  const imageUrl = localeUrl(locale, "/opengraph-image", SITE_URL);
  const twitterImageUrl = localeUrl(locale, "/twitter-image", SITE_URL);
  const image = {
    url: imageUrl,
    alt: imageAlt,
    width: OG_SIZE.width,
    height: OG_SIZE.height,
    type: OG_TYPE,
  };

  return {
    openGraph: {
      type,
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((item) => item !== locale).map((item) => OG_LOCALES[item]),
      images: [image],
      ...(type === "article" && authors ? { authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: twitterImageUrl, alt: imageAlt, width: OG_SIZE.width, height: OG_SIZE.height }],
    },
  };
}

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

function socialImage(locale: Locale) {
  return {
    "@type": "ImageObject" as const,
    url: localeUrl(locale, "/opengraph-image", SITE_URL),
    width: OG_SIZE.width,
    height: OG_SIZE.height,
  };
}

function person() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_NAME,
    givenName: GIVEN_NAME,
    familyName: FAMILY_NAME,
    // One url for the entity. Localized pages point here via ProfilePage.mainEntity.
    url: SITE_URL,
    image: {
      "@type": "ImageObject",
      url: PORTRAIT_URL,
      width: OG_SIZE.width,
      height: OG_SIZE.height,
    },
    email: DEV_EMAIL,
    description: copy.en.metaDescription,
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

function webSite() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    // Stable across locales: the same @id must not change language per page.
    inLanguage: [...LOCALES],
    image: PORTRAIT_URL,
    publisher: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
  };
}

/**
 * Rendered by the `[locale]` layout, so it is on every indexable page.
 * The graph is one entity, so it does not vary by the page's locale.
 */
export function siteJsonLd() {
  return { "@context": "https://schema.org", "@graph": [webSite(), person()] };
}

function breadcrumbList(locale: Locale, path: string, name: string) {
  const home = localeUrl(locale, "/", SITE_URL);
  const url = localeUrl(locale, path, SITE_URL);
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: home },
      { "@type": "ListItem", position: 2, name, item: url },
    ],
  };
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
    primaryImageOfPage: socialImage(locale),
    dateModified: isoDateTime(RELEASE_DATE),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": PERSON_ID },
  };
}

/**
 * Spotlight work that has a public destination, in desk order. The list item
 * URL prefers the on-site case study so the portfolio keeps the ranking; the
 * live site and repository hang off the same node.
 */
export function portfolioJsonLd(locale: Locale) {
  const url = localeUrl(locale, "/", SITE_URL);
  const works = featured.flatMap((project) => {
    const onSite = project.caseStudy ? localeUrl(locale, `/work/${project.caseStudy}`, SITE_URL) : undefined;
    const destination = onSite ?? project.live ?? project.repo;
    if (!destination) return [];
    return [{ project, destination }];
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}#works`,
    name: copy[locale].workTitle,
    url,
    inLanguage: locale,
    numberOfItems: works.length,
    itemListElement: works.map(({ project, destination }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": project.repo && !project.private ? "SoftwareSourceCode" : "CreativeWork",
        name: project.name,
        description: project.blurb[locale],
        url: destination,
        inLanguage: locale,
        author: { "@id": PERSON_ID },
        keywords: project.stack.join(", "),
        ...(project.repo && !project.private ? { codeRepository: project.repo } : {}),
        ...(project.live && project.live !== destination ? { sameAs: [project.live] } : {}),
      },
    })),
  };
}

/** The CV page: the HTML document plus the PDF it embeds. */
export function cvPageJsonLd(locale: Locale) {
  const url = localeUrl(locale, "/cv", SITE_URL);
  const title = `${copy[locale].cvTitle} — ${SITE_NAME}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(locale, "/cv", copy[locale].cvTitle),
      {
        "@type": "DigitalDocument",
        "@id": `${url}#cv`,
        name: title,
        description: copy[locale].cvLede,
        url,
        encodingFormat: "application/pdf",
        inLanguage: locale,
        dateModified: isoDateTime(RELEASE_DATE),
        author: { "@id": PERSON_ID },
        isPartOf: { "@id": WEBSITE_ID },
        associatedMedia: {
          "@type": "MediaObject",
          contentUrl: `${SITE_URL}${CV_PATH}`,
          encodingFormat: "application/pdf",
        },
      },
    ],
  };
}

/** The legal notice, with the date the prose itself last changed. */
export function privacyPageJsonLd(locale: Locale) {
  const url = localeUrl(locale, "/privacy", SITE_URL);
  const title = `${copy[locale].privacyTitle} — ${SITE_NAME}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(locale, "/privacy", copy[locale].privacyTitle),
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: title,
        description: copy[locale].privacyLede,
        url,
        inLanguage: locale,
        dateModified: isoDateTime(PRIVACY_UPDATED),
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": PERSON_ID },
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
    ],
  };
}

/** Case-study page: breadcrumb trail plus the work itself, authored by the Person. */
export function caseStudyJsonLd(locale: Locale, study: CaseStudy) {
  const url = localeUrl(locale, `/work/${study.slug}`, SITE_URL);
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(locale, `/work/${study.slug}`, study.project),
      {
        "@type": study.repo ? "SoftwareSourceCode" : "CreativeWork",
        "@id": `${url}#work`,
        name: study.project,
        headline: `${study.project} — ${copy[locale].caseStudy}`,
        description: study.description,
        url,
        image: socialImage(locale),
        inLanguage: locale,
        dateModified: isoDateTime(RELEASE_DATE),
        isAccessibleForFree: true,
        keywords: study.stack.join(", "),
        author: { "@id": PERSON_ID },
        isPartOf: { "@id": WEBSITE_ID },
        ...(study.repo ? { codeRepository: study.repo } : {}),
        ...(study.live ? { sameAs: [study.live] } : {}),
      },
    ],
  };
}

/**
 * JSON for an inline `<script type="application/ld+json">`. The payload carries
 * MDX frontmatter and the CSP allows inline scripts, so `<` is escaped: a stray
 * `</script>` in a description must not end the block early. U+2028/U+2029 too.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
