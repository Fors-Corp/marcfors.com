import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TraceTheater } from "@/components/TraceTheater";
import { copy } from "@/data/copy";
import { isLocale, localeUrl, withLocale } from "@/lib/locale";
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
  const title = `${t.traceTitle} — ${SITE_NAME}`;
  const url = localeUrl(locale, "/lab/trace", SITE_URL);
  return {
    title,
    description: t.traceLede,
    robots: { index: false, follow: true },
    alternates: { canonical: url },
    ...pageSocialMetadata({ locale, title, description: t.traceLede, url }),
  };
}

export default async function TracePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];

  return (
    <div className="wrap">
      <header className="top">
        <Link className="brand" href={withLocale(locale, "/")}>
          {SITE_NAME}
        </Link>
        <Link href={withLocale(locale, "/")}>{t.homeCta}</Link>
      </header>
      <main id="main">
        <TraceTheater
          strings={{
            traceTitle: t.traceTitle,
            traceLede: t.traceLede,
            tracePaste: t.tracePaste,
            traceSample: t.traceSample,
            traceClear: t.traceClear,
            traceInvalid: t.traceInvalid,
            traceEmpty: t.traceEmpty,
            traceSpans: t.traceSpans,
            traceDuration: t.traceDuration,
          }}
        />
      </main>
    </div>
  );
}
