import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Locale } from "@/lib/locale";

/**
 * Case-study prose lives in content/work/<slug>/<locale>.mdx — one MDX file
 * per locale, each self-contained with its own YAML frontmatter (so a study
 * can be added or edited by touching files in one directory, no TS object to
 * keep in sync). This module reads only the frontmatter, via gray-matter, so
 * listing/linking/metadata never has to compile MDX to JSX. The prose body is
 * loaded separately, with a dynamic `import()`, by whatever renders it.
 */

const CONTENT_ROOT = path.join(process.cwd(), "content", "work");

export type CaseStudyFrontmatter = {
  project: string;
  stack: string[];
  live?: string;
  repo?: string;
  order: number;
  /** Short, locale-specific summary — feeds <meta description> and OG tags. */
  description: string;
};

export type CaseStudy = CaseStudyFrontmatter & { slug: string };

function isCaseStudyFrontmatter(value: unknown): value is CaseStudyFrontmatter {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.project === "string" &&
    Array.isArray(row.stack) &&
    row.stack.every((item) => typeof item === "string") &&
    (row.live === undefined || typeof row.live === "string") &&
    (row.repo === undefined || typeof row.repo === "string") &&
    typeof row.order === "number" &&
    typeof row.description === "string"
  );
}

/** Every case-study slug, sorted by its English frontmatter's `order`. */
export function listCaseStudySlugs(): string[] {
  const slugs = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  return slugs.sort((a, b) => {
    const orderOf = (slug: string) => caseStudyBySlug(slug, "en")?.order ?? 0;
    return orderOf(a) - orderOf(b);
  });
}

/** Reads and validates one slug's frontmatter for one locale. */
export function caseStudyBySlug(slug: string, locale: Locale): CaseStudy | undefined {
  const file = path.join(CONTENT_ROOT, slug, `${locale}.mdx`);
  if (!fs.existsSync(file)) return undefined;
  const { data } = matter(fs.readFileSync(file, "utf8"));
  if (!isCaseStudyFrontmatter(data)) {
    throw new Error(`content/work/${slug}/${locale}.mdx: frontmatter doesn't match CaseStudyFrontmatter`);
  }
  return { slug, ...data };
}

/**
 * The raw MDX prose body (frontmatter stripped, not compiled) — used only to
 * check a locale's body was actually translated, not left as a copy of the
 * English source.
 */
export function caseStudyBody(slug: string, locale: Locale): string | undefined {
  const file = path.join(CONTENT_ROOT, slug, `${locale}.mdx`);
  if (!fs.existsSync(file)) return undefined;
  return matter(fs.readFileSync(file, "utf8")).content.trim();
}
