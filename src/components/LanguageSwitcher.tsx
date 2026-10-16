"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flag } from "@/components/Flag";
import type { Locale } from "@/lib/locale";
import { isLocale, LOCALE_CODES, LOCALE_LABELS, LOCALES, stripLocale, withLocale } from "@/lib/locale";
import { writeLocale } from "@/lib/prefs";

export function LanguageSwitcher({ locale, langLabel }: { locale: Locale; langLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const rest = stripLocale(pathname ?? "/");

  return (
    <>
      <div className="langs" role="group" aria-label={langLabel}>
        {LOCALES.map((code) => (
          <Link
            key={code}
            href={withLocale(code, rest)}
            lang={code}
            hrefLang={code}
            aria-label={`${LOCALE_CODES[code]} · ${LOCALE_LABELS[code]}`}
            aria-current={locale === code ? "page" : undefined}
            onClick={() => writeLocale(code)}
          >
            <Flag locale={code} className="flag" />
            <span className="lang-code">{LOCALE_CODES[code]}</span>
          </Link>
        ))}
      </div>
      <label className="lang-select-wrap">
        <span className="vh">{langLabel}</span>
        <select
          className="lang-select"
          aria-label={langLabel}
          value={locale}
          onChange={(event) => {
            const next = event.target.value;
            if (!isLocale(next)) return;
            writeLocale(next);
            router.push(withLocale(next, rest));
          }}
        >
          {LOCALES.map((code) => (
            <option key={code} value={code} lang={code}>
              {LOCALE_LABELS[code]}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
