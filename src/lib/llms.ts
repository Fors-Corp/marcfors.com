import { caseStudyBody, caseStudyBySlug, listCaseStudySlugs } from "@/data/caseStudies";
import { careerBreak, copy, education, experience, languages } from "@/data/copy";
import { featured } from "@/data/projects";
import { LOCALES, localeUrl } from "@/lib/locale";
import { OCCUPATIONS } from "@/lib/seo";
import { CV_PATH, DEV_EMAIL, GITHUB_ORG_URL, GITHUB_URL, LINKEDIN_URL, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Plain-text briefs for answer engines (ChatGPT search, Perplexity, Claude,
 * Google AI Overviews and anything else that fetches `/llms.txt`). Facts only,
 * drawn from the same sources as the visible site and the CV (see AGENTS.md).
 * `llmsTxt` is the compact index; `llmsFullTxt` inlines the long-form facts.
 */

const caseStudyUrl = (slug: string) => localeUrl("en", `/work/${slug}`, SITE_URL);

function header(): string[] {
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${copy.en.metaDescription}`,
    "",
    `${SITE_NAME} is an ${OCCUPATIONS.join(", ")} in Barcelona. Public mailbox: ${DEV_EMAIL}. There is no phone number on this site.`,
    "",
  ];
}

function pages(): string[] {
  return [
    "## Canonical pages",
    ...LOCALES.map((locale) => `- ${locale}: ${localeUrl(locale, "/", SITE_URL)}`),
    `- CV: ${SITE_URL}/cv (${SITE_URL}${CV_PATH})`,
    `- Ask (portfolio RAG): ${SITE_URL}/ask`,
    `- Privacy: ${SITE_URL}/privacy`,
    "",
    "## Profiles",
    `- Site: ${SITE_URL}`,
    `- Email: ${DEV_EMAIL}`,
    `- GitHub: ${GITHUB_URL}`,
    `- GitHub org: ${GITHUB_ORG_URL}`,
    `- LinkedIn: ${LINKEDIN_URL}`,
    "",
  ];
}

function selectedWork(): string[] {
  const works = featured.flatMap((project) => {
    const onSite = project.caseStudy ? caseStudyUrl(project.caseStudy) : undefined;
    const destination = onSite ?? project.live ?? project.repo;
    if (!destination) return [];
    const source = project.repo && !project.private ? ` Source: ${project.repo}.` : "";
    return [`- ${project.name} (${destination}). ${project.blurb.en}${source}`];
  });
  return ["## Selected work", ...works, ""];
}

function experienceSection(withPoints: boolean): string[] {
  const jobs = experience.en.flatMap((job) => [
    `- ${job.when}: ${job.title}, ${job.org}. ${job.body}`,
    ...(withPoints ? job.points.map((point) => `  - ${point}`) : []),
  ]);
  return [
    "## Experience",
    `- ${careerBreak.en.when}: AI Software Engineer, Fors Corp (independent practice). ${careerBreak.en.body}`,
    ...jobs,
    "",
    "## Education and languages",
    ...education.en.map((line) => `- ${line}`),
    `- Languages: ${languages.en}`,
    "",
  ];
}

/** The llms.txt "Optional" section: longer material a model can skip when context is short. */
function optional(): string[] {
  return [
    "## Optional",
    `- [Full text](${SITE_URL}/llms-full.txt): every English case study and the experience detail in one file`,
    `- [CV (PDF)](${SITE_URL}${CV_PATH}): the published CV, the source of truth for facts here`,
    `- [Sitemap](${SITE_URL}/sitemap.xml): every localized URL with hreflang alternates`,
    "",
  ];
}

function closing(): string[] {
  return [
    "The site stores only a locale preference the visitor chooses. Ask posts questions to /api/ask for portfolio-grounded answers (Neon pgvector + Anthropic). It does not use advertising or cross-site analytics trackers; host Web Analytics is disclosed on /privacy.",
    "",
  ];
}

export function llmsTxt(): string {
  return [
    ...header(),
    ...pages(),
    ...selectedWork(),
    ...experienceSection(false),
    ...optional(),
    ...closing(),
  ].join("\n");
}

/** Every English case study, body included, so a model can quote without crawling. */
export function llmsFullTxt(): string {
  const studies = listCaseStudySlugs().flatMap((slug) => {
    const study = caseStudyBySlug(slug, "en");
    const body = caseStudyBody(slug, "en");
    if (!study || !body) return [];
    return [
      `### ${study.project}`,
      "",
      `- Page: ${caseStudyUrl(slug)}`,
      ...(study.live ? [`- Live: ${study.live}`] : []),
      `- Stack: ${study.stack.join(", ")}`,
      "",
      study.description,
      "",
      // Demote body headings under the "### <project>" heading.
      body.replace(/^(#{2,4}) /gm, "$1## "),
      "",
    ];
  });

  return [
    ...header(),
    ...pages(),
    ...selectedWork(),
    ...experienceSection(true),
    "## Case studies",
    "",
    ...studies,
    ...closing(),
  ].join("\n");
}
