import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { isLocale, languageAlternates, LOCALES, localeUrl, OG_LOCALES, type Locale } from "@/lib/locale";
import { JsonLd } from "@/components/JsonLd";
import { copy } from "@/data/copy";
import { FAMILY_NAME, GIVEN_NAME, siteJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
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
// guards the assumption. `weight: ["500"]` on the mono stays — it is the body
// font and `font-synthesis: none` (globals.css) forbids a faux-bold fallback.
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif-loaded",
  display: "swap",
  adjustFontFallback: true,
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-loaded",
  display: "swap",
  adjustFontFallback: true,
});

// Match the paper/ink palette backgrounds (src/lib/themePalettes.ts) so the mobile
// browser chrome tracks the active theme instead of a single hard-coded colour.
export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#10141c" },
    { media: "(prefers-color-scheme: light)", color: "#f4efe4" },
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
    },
    twitter: { card: "summary_large_image", title: t.metaTitle, description: t.metaDescription },
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

  return (
    <html lang={locale} className={`${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <body
        style={
          {
            "--serif": "var(--font-serif-loaded), Fraunces, Georgia, serif",
            "--mono": "var(--font-mono-loaded), ui-monospace, monospace",
          } as CSSProperties
        }
      >
        <script dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }} />
        {/* application/ld+json: WebSite + Person graph, shared by every page. */}
        <JsonLd data={siteJsonLd(locale)} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
