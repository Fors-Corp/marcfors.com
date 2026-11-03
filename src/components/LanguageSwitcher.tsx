"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Flag } from "@/components/Flag";
import type { Locale } from "@/lib/locale";
import { LOCALE_CODES, LOCALE_LABELS, LOCALES, stripLocale, withLocale } from "@/lib/locale";
import { writeLocale } from "@/lib/prefs";

export function LanguageSwitcher({ locale, langLabel }: { locale: Locale; langLabel: string }) {
  const pathname = usePathname();
  const rest = stripLocale(pathname ?? "/");
  const rootRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!root.open) return;
      if (event.target instanceof Node && root.contains(event.target)) return;
      root.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && root.open) root.open = false;
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={rootRef} className="chrome-menu langs-menu">
      <summary className="chrome-menu-trigger" aria-label={langLabel}>
        <Flag locale={locale} className="flag" />
        <span className="lang-code">{LOCALE_CODES[locale]}</span>
      </summary>
      <div className="chrome-menu-panel langs" role="group" aria-label={langLabel}>
        {LOCALES.map((code) => (
          <Link
            key={code}
            href={withLocale(code, rest)}
            lang={code}
            hrefLang={code}
            aria-label={`${LOCALE_CODES[code]} · ${LOCALE_LABELS[code]}`}
            aria-current={locale === code ? "page" : undefined}
            onClick={() => {
              writeLocale(code);
              if (rootRef.current) rootRef.current.open = false;
            }}
          >
            <Flag locale={code} className="flag" />
            <span className="lang-code">{LOCALE_CODES[code]}</span>
            <span className="lang-name">{LOCALE_LABELS[code]}</span>
          </Link>
        ))}
      </div>
    </details>
  );
}
