import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { copy } from "@/data/copy";
import { isLocale, languageAlternates, localeUrl, withLocale } from "@/lib/locale";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { SUPPORT_THANKS_PATH } from "@/lib/support";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return {
    title: `${t.supportThanksTitle} — ${SITE_NAME}`,
    description: t.supportThanksBody,
    // Where Stripe sends a visitor after a tip. Nothing to rank for, so it stays
    // out of the index and the sitemap (next.config.ts adds the header too).
    robots: { index: false, follow: false },
    alternates: {
      canonical: localeUrl(locale, SUPPORT_THANKS_PATH, SITE_URL),
      languages: languageAlternates(SUPPORT_THANKS_PATH, SITE_URL),
    },
  };
}

export default async function SupportThanksPage({ params }: { params: Promise<{ locale: string }> }) {
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
        <h1>{t.supportThanksTitle}</h1>
        <p className="muted">{t.supportThanksBody}</p>
      </main>
    </div>
  );
}
