import { withLocale, type Locale } from "@/lib/locale";

/** Homepage section each corpus file describes. Ids are the ones in Desk.tsx. */
const HOME_HASH: Record<string, string> = {
  "about.md": "intro",
  "contact.md": "contact",
  "education.md": "edu",
  "experience.md": "work",
  "projects.md": "projects",
  "skills.md": "skills",
};

/** Corpus files that are their own page, not a homepage section. */
const PAGE_PATH: Record<string, string> = {
  "privacy.md": "/privacy",
  "trace-theater.md": "/lab/trace",
};

function hashHref(locale: Locale, hash: string): string {
  const base = withLocale(locale, "/");
  return base === "/" ? `/#${hash}` : `${base}/#${hash}`;
}

/** Portfolio URL for a corpus source. Same-tab so the floating chat stays mounted. */
export function sourceHref(sourcePath: string, locale: Locale): string {
  const home = HOME_HASH[sourcePath];
  if (home) return hashHref(locale, home);
  const page = PAGE_PATH[sourcePath];
  if (page) return withLocale(locale, page);
  const work = /^work\/([a-z0-9-]+)\.md$/.exec(sourcePath);
  if (work) return withLocale(locale, `/work/${work[1]}`);
  // corpus/projects/*.md has no /work/<slug> page, so it stays on #projects.
  return hashHref(locale, "projects");
}
