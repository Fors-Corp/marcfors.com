import type { MetadataRoute } from "next";
import { listCaseStudySlugs } from "@/data/caseStudies";
import { languageAlternates, LOCALES, localeUrl } from "@/lib/locale";
import { RELEASE_DATE, SITE_URL } from "@/lib/site";

// A fixed release date keeps `lastModified` stable between builds. `new Date()` here
// told crawlers every URL changed on every fetch, which dilutes the crawl signal.
const lastModified = new Date(`${RELEASE_DATE}T00:00:00.000Z`);

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/cv", ...listCaseStudySlugs().map((slug) => `/work/${slug}`)];
  return LOCALES.flatMap((locale) =>
    pages.map((path) => ({
      url: localeUrl(locale, path, SITE_URL),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
      // Every localized URL lists the full alternate set (incl. x-default) so
      // crawlers see the hreflang graph from the sitemap, not just the <head>.
      alternates: { languages: languageAlternates(path, SITE_URL) },
    })),
  );
}
