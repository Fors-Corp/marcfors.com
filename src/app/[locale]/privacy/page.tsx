import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { copy } from "@/data/copy";
import { isLocale, languageAlternates, LOCALES, localeUrl, withLocale } from "@/lib/locale";
import { PRIVACY_UPDATED, SITE_NAME, SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return {
    title: `${t.privacyTitle} — ${SITE_NAME}`,
    description: t.privacyLede,
    // Indexable on purpose: a legal notice should be findable, and it is listed
    // in the sitemap.
    alternates: {
      canonical: localeUrl(locale, "/privacy", SITE_URL),
      languages: languageAlternates("/privacy", SITE_URL),
    },
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${PRIVACY_UPDATED}T00:00:00.000Z`),
  );
  // The prose body is compiled MDX; `locale` was validated by isLocale above and
  // generateStaticParams only enumerates LOCALES, never request-controlled
  // input, so this dynamic specifier is safe.
  const { default: Content } = await import(`@content/legal/privacy/${locale}.mdx`);

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
      <main id="main" className="case">
        <h1>{t.privacyTitle}</h1>
        <p className="lede">{t.privacyLede}</p>
        <p className="muted">
          {t.privacyUpdated} <time dateTime={PRIVACY_UPDATED}>{updated}</time>
        </p>
        <div className="case-body">
          <Content />
        </div>
      </main>
    </div>
  );
}
