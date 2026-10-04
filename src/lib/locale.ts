export const LOCALES = ["en", "es", "ca", "it", "pt", "de", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_CODES: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  ca: "CA",
  it: "IT",
  pt: "PT",
  de: "DE",
  fr: "FR",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ca: "Català",
  it: "Italiano",
  pt: "Português",
  de: "Deutsch",
  fr: "Français",
};

export const OG_LOCALES: Record<Locale, string> = {
  en: "en_GB",
  es: "es_ES",
  ca: "ca_ES",
  it: "it_IT",
  pt: "pt_PT",
  de: "de_DE",
  fr: "fr_FR",
};

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_KEY = "marcfors-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function localeCookie(value: Locale, secure = false): string {
  const extra = secure ? "; Secure" : "";
  return `${LOCALE_KEY}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${extra}`;
}

export function stripLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && isLocale(parts[0])) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function withLocale(locale: Locale, pathname = "/"): string {
  const path = stripLocale(pathname);
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function localeUrl(locale: Locale, pathname = "/", origin: string): string {
  const rel = withLocale(locale, pathname);
  return rel === "/" ? origin : `${origin}${rel}`;
}

export function languageAlternates(pathname: string, origin: string): Record<string, string> {
  const languages: Record<string, string> = { "x-default": localeUrl(DEFAULT_LOCALE, pathname, origin) };
  for (const locale of LOCALES) {
    languages[locale] = localeUrl(locale, pathname, origin);
  }
  return languages;
}

export function preferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  for (const part of acceptLanguage.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    const base = tag.split("-")[0] ?? "";
    if (isLocale(tag)) return tag;
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function isCrawler(userAgent: string | null): boolean {
  return Boolean(
    userAgent &&
      /bot|crawler|spider|google|bing|yandex|baidu|slurp|duckduck|facebookexternalhit|preview|linkedinbot/i.test(
        userAgent,
      ),
  );
}
