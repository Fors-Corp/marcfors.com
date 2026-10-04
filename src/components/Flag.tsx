import type { Locale } from "@/lib/locale";

/**
 * Tiny inline SVG flags for the language switcher — one per locale. Simplified
 * to read at ~40px; `en` is the Union Jack, `ca` the Catalan senyera. Decorative
 * only: the switcher link carries the accessible name, so each SVG is aria-hidden.
 */
export function Flag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 16"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {FLAGS[locale]}
    </svg>
  );
}

const FLAGS: Record<Locale, React.ReactNode> = {
  en: (
    <>
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M12 0V16M0 8H24" stroke="#fff" strokeWidth="5.3" />
      <path d="M12 0V16M0 8H24" stroke="#C8102E" strokeWidth="3.2" />
    </>
  ),
  es: (
    <>
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </>
  ),
  ca: (
    <>
      <rect width="24" height="16" fill="#FCDD09" />
      <rect y="1.778" width="24" height="1.778" fill="#DA121A" />
      <rect y="5.333" width="24" height="1.778" fill="#DA121A" />
      <rect y="8.889" width="24" height="1.778" fill="#DA121A" />
      <rect y="12.444" width="24" height="1.778" fill="#DA121A" />
    </>
  ),
  it: (
    <>
      <rect width="24" height="16" fill="#fff" />
      <rect width="8" height="16" fill="#009246" />
      <rect x="16" width="8" height="16" fill="#CE2B37" />
    </>
  ),
  pt: (
    <>
      <rect width="24" height="16" fill="#DA291C" />
      <rect width="9.6" height="16" fill="#046A38" />
      <circle cx="9.6" cy="8" r="3" fill="#FFE900" stroke="#fff" strokeWidth="0.5" />
      <circle cx="9.6" cy="8" r="1.3" fill="#DA291C" />
    </>
  ),
  de: (
    <>
      <rect width="24" height="16" fill="#000" />
      <rect y="5.333" width="24" height="5.334" fill="#DD0000" />
      <rect y="10.667" width="24" height="5.333" fill="#FFCE00" />
    </>
  ),
  fr: (
    <>
      <rect width="24" height="16" fill="#fff" />
      <rect width="8" height="16" fill="#0055A4" />
      <rect x="16" width="8" height="16" fill="#EF4135" />
    </>
  ),
};
