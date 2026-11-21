import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Spectral, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { isLocale, languageAlternates, LOCALES, localeUrl, OG_LOCALES, type Locale } from "@/lib/locale";
import { DeferredAskWidget } from "@/components/DeferredAskWidget";
import { JsonLd } from "@/components/JsonLd";
import { copy } from "@/data/copy";
import { askChatWidgetStrings } from "@/lib/askStrings";
import { OG_SIZE, OG_TYPE } from "@/lib/og";
import { FAMILY_NAME, GIVEN_NAME, OCCUPATIONS, siteJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ANTI_FLASH_SCRIPT } from "@/lib/theme";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// `dynamicParams` is left at its default (true) so that on-demand `notFound()`
// renders (e.g. `/de/work/<unknown-slug>`) can still reach `app/[locale]/not-found.tsx`.
// Unknown locales are rejected explicitly by the `isLocale` guards below.

// Only the `latin` subset is preloaded. Every glyph the seven locales actually
// render (es/ca/it/pt/de accents, Catalan's U+00B7 middot) lives in `latin` —
// `latin-ext` is Central/Eastern European and was costing 52,124 B of
// High-priority preload nobody needed. This is fail-safe, not a gamble: next/font
// still emits the `latin-ext` @font-face rules with their `unicode-range`, so if
// such a character ever lands in copy (or in a remote GitHub repo name) the
// browser fetches that file lazily instead of showing tofu. `fontSubset.test.ts`
// guards the assumption. Manrope carries the UI/body voice; Spectral is display. `font-synthesis: none`
// (globals.css) forbids faux-bold fallbacks.
// Weight 700 is unused in CSS (`font-synthesis: none` + explicit 400/500/600).
// Dropping it removes a High-priority latin preload (~15 KiB) from the FCP path.
// `optional` (not `swap`): with inlined CSS, first paint is early enough that a
// late swap was shifting the hero ~0.19 CLS. Optional keeps metric overrides and
// skips the swap when the face is not ready in time — no CLS, brand fonts still
// apply on warm/fast loads.
const serif = Spectral({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-serif-loaded",
  display: "optional",
  adjustFontFallback: true,
});

const mono = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-loaded",
  display: "optional",
  adjustFontFallback: true,
});

// Match the paper/ink palette backgrounds (src/lib/themePalettes.ts) so the mobile
// browser chrome tracks the active theme instead of a single hard-coded colour.
export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
    { media: "(prefers-color-scheme: light)", color: "#eef2f8" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;

  const t = copy[locale];
  const imageAlt = `${SITE_NAME} — ${OCCUPATIONS[0]}`;
  const image = {
    url: localeUrl(locale, "/opengraph-image", SITE_URL),
    alt: imageAlt,
    width: OG_SIZE.width,
    height: OG_SIZE.height,
    type: OG_TYPE,
  };
  // Localized <title>/<description>: a search in Spanish or German should see a
  // snippet in that language, not the English default from the root layout.
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: localeUrl(locale, "/", SITE_URL),
      languages: languageAlternates("/", SITE_URL),
    },
    openGraph: {
      type: "profile",
      firstName: GIVEN_NAME,
      lastName: FAMILY_NAME,
      title: t.metaTitle,
      description: t.metaDescription,
      url: localeUrl(locale, "/", SITE_URL),
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((item) => item !== locale).map((item) => OG_LOCALES[item]),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: t.metaTitle,
      description: t.metaDescription,
      images: [{ url: localeUrl(locale, "/twitter-image", SITE_URL), alt: imageAlt }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];

  return (
    <html lang={locale} className={`${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <body
        style={
          {
            "--serif": "var(--font-serif-loaded), Spectral, Georgia, serif",
            "--mono": "var(--font-mono-loaded), Manrope, system-ui, sans-serif",
          } as CSSProperties
        }
      >
        {/* Sibling of the Ask widget so the open dialog can mark the page inert. */}
        <div data-page-root="">
          <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
          {/* application/ld+json: WebSite + Person graph, shared by every page. */}
          <JsonLd data={siteJsonLd()} />
          {children}
          {/* Skip off-Vercel so local / LHCI builds do not 404 `/_vercel/insights`. */}
          {process.env.VERCEL ? <Analytics /> : null}
        </div>
        <DeferredAskWidget strings={askChatWidgetStrings(t)} locale={locale} />
      </body>
    </html>
  );
}
