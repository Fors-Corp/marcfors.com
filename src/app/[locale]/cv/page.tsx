import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CvViewer } from "@/components/CvViewer";
import { copy } from "@/data/copy";
import { isLocale, languageAlternates, localeUrl, withLocale } from "@/lib/locale";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return {
    title: `${t.cvTitle} — ${SITE_NAME}`,
    description: t.cvLede,
    // Unlike /print — a duplicate of the home page copy, kept out of the index —
    // this page hosts the CV itself, which is exactly what a recruiter searches
    // for. It stays indexable and is listed in the sitemap.
    alternates: {
      canonical: localeUrl(locale, "/cv", SITE_URL),
      languages: languageAlternates("/cv", SITE_URL),
    },
  };
}

export default async function CvPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];

  return (
    <div className="wrap">
      <header className="top">
        <Link className="brand" href={withLocale(locale, "/")}>
          {SITE_NAME}
        </Link>
        <div className="cta-row">
          <Link className="cta ghost" href={withLocale(locale, "/")}>
            {t.homeCta}
          </Link>
        </div>
      </header>
      <main id="main">
        <h1>{t.cvTitle}</h1>
        <p className="muted">{t.cvLede}</p>
        <CvViewer locale={locale} />
      </main>
    </div>
  );
}
