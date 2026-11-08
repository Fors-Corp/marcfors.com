import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { PortfolioAsk } from "@/components/PortfolioAsk";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { copy } from "@/data/copy";
import { isLocale, languageAlternates, localeUrl, withLocale } from "@/lib/locale";
import { pageSocialMetadata } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const title = `${t.askTitle} — ${SITE_NAME}`;
  const url = localeUrl(locale, "/ask", SITE_URL);
  return {
    title,
    description: t.askLede,
    ...pageSocialMetadata({ locale, title, description: t.askLede, url }),
    alternates: {
      canonical: url,
      languages: languageAlternates("/ask", SITE_URL),
    },
  };
}

export default async function AskPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];

  return (
    <div className="wrap">
      <header className="top">
        <Link className="brand" href={withLocale(locale, "/")}>
          <BrandMark />
          {SITE_NAME}
        </Link>
        <nav className="nav" aria-label={t.navLabel}>
          <Link href={withLocale(locale, "/")}>{t.homeCta}</Link>
          <Link href={withLocale(locale, "/ask")} aria-current="page">
            {t.askNav}
          </Link>
          <LanguageSwitcher locale={locale} langLabel={t.lang} />
          <ThemeSwitcher label={t.theme} names={t.themeNames} />
        </nav>
      </header>
      <main id="main" className="sheet ask-page" tabIndex={-1}>
        <PortfolioAsk
          strings={{
            title: t.askTitle,
            lede: t.askLede,
            placeholder: t.askPlaceholder,
            submit: t.askSubmit,
            busy: t.askBusy,
            empty: t.askEmpty,
            error: t.askError,
            unavailable: t.askUnavailable,
            citations: t.askCitations,
            samplesLabel: t.askSamplesLabel,
            samples: t.askSamples,
            sourcesLabel: t.askSourcesLabel,
            sourcesEmpty: t.askSourcesEmpty,
            sourcesUnavailable: t.askSourcesUnavailable,
          }}
        />
      </main>
    </div>
  );
}
