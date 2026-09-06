import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { WordAtlas } from "@/components/WordAtlas";
import { caseStudyBySlug, listCaseStudySlugs } from "@/data/caseStudies";
import { copy } from "@/data/copy";
import { ATLAS_COPY } from "@/data/wordAtlas";
import { isLocale, languageAlternates, LOCALES, localeUrl, withLocale } from "@/lib/locale";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => listCaseStudySlugs().map((slug) => ({ locale, slug })));
}

// Every case study is enumerated above; a slug outside that set 404s instead
// of falling through to on-demand rendering, which would undo static export.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const study = caseStudyBySlug(slug, locale);
  if (!study) notFound();
  return {
    title: `${study.project} — ${copy[locale].caseStudy} — ${SITE_NAME}`,
    description: study.description,
    alternates: {
      canonical: localeUrl(locale, `/work/${slug}`, SITE_URL),
      languages: languageAlternates(`/work/${slug}`, SITE_URL),
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const study = caseStudyBySlug(slug, locale);
  if (!study) notFound();
  const t = copy[locale];
  // The prose body is compiled MDX; the slug is one of the fixed set
  // `generateStaticParams` just enumerated from the same content directory,
  // never request-controlled, so this dynamic specifier is safe.
  const { default: Content } = await import(`@content/work/${slug}/${locale}.mdx`);

  return (
    <div className="wrap">
      <header className="top">
        <Link className="brand" href={withLocale(locale, "/")}>
          <BrandMark />
          {SITE_NAME}
        </Link>
        <Link href={withLocale(locale, "/")}>{t.homeCta}</Link>
      </header>
      <main id="main" className="case">
        <p className="kicker">{t.caseStudy}</p>
        <h1>{study.project}</h1>
        <div className="chips">
          {study.stack.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
        <div className="case-body">
          <Content />
        </div>
        <div className="links">
          {study.live ? (
            <a href={study.live} target="_blank" rel="noopener noreferrer">
              {t.live}
            </a>
          ) : null}
          {study.repo ? (
            <a href={study.repo} target="_blank" rel="noopener noreferrer">
              {t.source}
            </a>
          ) : null}
        </div>
      </main>
      {slug === "wordkeep" ? (
        <section className="atlas-block" aria-label={ATLAS_COPY[locale].heading}>
          <h2>{ATLAS_COPY[locale].heading}</h2>
          <p className="lede">{ATLAS_COPY[locale].lede}</p>
          <WordAtlas locale={locale} />
        </section>
      ) : null}
    </div>
  );
}
