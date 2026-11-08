import { withLocale, type Locale } from "@/lib/locale";

/** Homepage section each corpus file describes. */
const HOME_HASH: Record<string, string> = {
  "about.md": "intro",
  "experience.md": "work",
  "skills.md": "skills",
  "projects.md": "projects",
};

function hashHref(locale: Locale, hash: string): string {
  const base = withLocale(locale, "/");
  return base === "/" ? `/#${hash}` : `${base}/#${hash}`;
}

/** Portfolio URL for a corpus source. Same-tab so the floating chat stays mounted. */
export function sourceHref(sourcePath: string, locale: Locale): string {
  const home = HOME_HASH[sourcePath];
  if (home) return hashHref(locale, home);
  const work = /^work\/([a-z0-9-]+)\.md$/.exec(sourcePath);
  if (work) return withLocale(locale, `/work/${work[1]}`);
  return hashHref(locale, "projects");
}
