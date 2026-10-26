import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { PrintDesk } from "@/components/PrintDesk";
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
  const title = `${copy[locale].printTitle} — ${SITE_NAME}`;
  const url = localeUrl(locale, "/print", SITE_URL);
  return {
    title,
    description: copy[locale].cvLede,
    robots: { index: false, follow: true },
    ...pageSocialMetadata({ locale, title, description: copy[locale].cvLede, url }),
    alternates: {
      canonical: url,
      languages: languageAlternates("/print", SITE_URL),
    },
  };
}

export default async function PrintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];

  return (
    <div className="wrap print-wrap">
      <header className="top print-chrome">
        <Link className="brand" href={withLocale(locale, "/")}>
          {SITE_NAME}
        </Link>
        <div className="cta-row">
          <PrintButton label={t.printCta} />
          <Link className="cta ghost" href={withLocale(locale, "/")}>
            {t.homeCta}
          </Link>
        </div>
      </header>
      <p className="muted print-chrome">{t.printHint}</p>
      <PrintDesk locale={locale} />
    </div>
  );
}
