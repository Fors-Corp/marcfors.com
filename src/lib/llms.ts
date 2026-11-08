import { featured } from "@/data/projects";
import { copy } from "@/data/copy";
import { LOCALES, localeUrl } from "@/lib/locale";
import { OCCUPATIONS } from "@/lib/seo";
import { CV_PATH, DEV_EMAIL, GITHUB_ORG_URL, GITHUB_URL, LINKEDIN_URL, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Plain-text brief for answer engines (ChatGPT search, Perplexity, Claude,
 * Google AI Overviews and anything else that fetches `/llms.txt`). Facts only,
 * drawn from the same sources as the visible site.
 */
export function llmsTxt(): string {
  const locales = LOCALES.map((locale) => `- ${locale}: ${localeUrl(locale, "/", SITE_URL)}`);
  const works = featured.flatMap((project) => {
    const onSite = project.caseStudy ? localeUrl("en", `/work/${project.caseStudy}`, SITE_URL) : undefined;
    const destination = onSite ?? project.live ?? project.repo;
    if (!destination) return [];
    const source = project.repo && !project.private ? ` Source: ${project.repo}.` : "";
    return [`- ${project.name} (${destination}). ${project.blurb.en}${source}`];
  });

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${copy.en.metaDescription}`,
    "",
    `${SITE_NAME} is an ${OCCUPATIONS.join(", ")} in Barcelona. Public mailbox: ${DEV_EMAIL}. There is no phone number on this site.`,
    "",
    "## Canonical pages",
    ...locales,
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
    "## Selected work",
    ...works,
    "",
    "The site stores only a locale preference the visitor chooses. Ask posts questions to /api/ask for portfolio-grounded answers (Neon pgvector + Anthropic). It does not use third-party analytics trackers.",
    "",
  ].join("\n");
}
