import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { isLocale, languageAlternates, LOCALES, localeUrl, OG_LOCALES, type Locale } from "@/lib/locale";
import { DEV_EMAIL, GITHUB_URL, LINKEDIN_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import { ANTI_FLASH_SCRIPT } from "@/lib/theme";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// `dynamicParams` is left at its default (true) so that on-demand `notFound()`
// renders (e.g. `/de/work/<unknown-slug>`) can still reach `app/[locale]/not-found.tsx`.
// Unknown locales are rejected explicitly by the `isLocale` guards below.

// Only the `latin` subset is preloaded. Every glyph the six locales actually
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

const title = `${SITE_NAME} — Frontend software engineer`;
const description =
  "Frontend software engineer in Barcelona. React, TypeScript, Angular. Previously Dynatrace Dashboards and Notebooks, CREALOGIX banking, T-Systems Justice.";

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

  return {
    title,
    description,
    alternates: {
      canonical: localeUrl(locale, "/", SITE_URL),
      languages: languageAlternates("/", SITE_URL),
    },
    openGraph: {
      title,
      description:
        "Seven-plus years in observability, fintech, banking and government. Based in Barcelona. Open to frontend software engineer roles.",
      url: localeUrl(locale, "/", SITE_URL),
      locale: OG_LOCALES[locale],
      alternateLocale: LOCALES.filter((item) => item !== locale).map((item) => OG_LOCALES[item]),
    },
  };
}

function jsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_NAME,
    url: localeUrl(locale, "/", SITE_URL),
    email: DEV_EMAIL,
    jobTitle: "Frontend software engineer",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Barcelona",
      addressCountry: "ES",
    },
    sameAs: [GITHUB_URL, LINKEDIN_URL],
    knowsAbout: ["React", "TypeScript", "Angular", "Next.js", "observability", "Playwright"],
    seeks: "Frontend software engineer roles in Barcelona or remote EU, open from December 2025",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(locale)) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
