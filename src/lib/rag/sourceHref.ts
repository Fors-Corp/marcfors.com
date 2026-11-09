import { withLocale, type Locale } from "@/lib/locale";
import { CV_SOURCE_PATH } from "@/lib/rag/lexical";
import { CV_DOWNLOAD_HASH } from "@/lib/site";

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
  [CV_SOURCE_PATH]: "/cv",
};

function hashHref(locale: Locale, hash: string): string {
  const base = withLocale(locale, "/");
  return base === "/" ? `/#${hash}` : `${base}/#${hash}`;
}

/** True for corpus paths Ask answers cite inline (markdown + CV PDF). */
export function isAskSourcePath(token: string): boolean {
  if (token.endsWith(".md")) return true;
  if (token === CV_SOURCE_PATH || token.startsWith("cv/")) return true;
  // Bare published filename sometimes appears without the cv/ prefix.
  if (token === "marc-fors-cv.pdf") return true;
  return false;
}

/** Portfolio URL for a corpus source. Same-tab so the floating chat stays mounted. */
export function sourceHref(sourcePath: string, locale: Locale): string {
  // CV chunks cite cv/marc-fors-cv.pdf — land on the on-site viewer at Download PDF.
  if (
    sourcePath === CV_SOURCE_PATH ||
    sourcePath.startsWith("cv/") ||
    sourcePath === "marc-fors-cv.pdf"
  ) {
    return `${withLocale(locale, "/cv")}#${CV_DOWNLOAD_HASH}`;
  }
  const home = HOME_HASH[sourcePath];
  if (home) return hashHref(locale, home);
  const page = PAGE_PATH[sourcePath];
  if (page) return withLocale(locale, page);
  const work = /^work\/([a-z0-9-]+)\.md$/.exec(sourcePath);
  if (work) return withLocale(locale, `/work/${work[1]}`);
  // corpus/projects/*.md has no /work/<slug> page, so it stays on #projects.
  return hashHref(locale, "projects");
}
