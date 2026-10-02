/**
 * "Support · 1,99 €" — the tip hub. Every Fors-Corp project links to
 * `https://marcfors.com/donate?from=<repo-slug>`; `src/app/donate/route.ts`
 * redirects that to the Stripe Payment Link held in `STRIPE_SUPPORT_LINK_URL`
 * (test link in Preview/Development, live link in Production — never in git).
 * The `/donate` path is kept for the hub URL, but visible copy says "Support":
 * these are voluntary tips to an individual, not charitable donations.
 */
export const SUPPORT_PATH = "/donate";
export const SUPPORT_THANKS_PATH = "/donate/thanks";
export const SUPPORT_LINK_ENV = "STRIPE_SUPPORT_LINK_URL";

/**
 * Projects allowed to tag a tip with `client_reference_id`. Anything else —
 * unknown, missing, or crafted — still reaches checkout, just untagged, so no
 * visitor-controlled string ever lands in the Stripe dashboard.
 */
export const SUPPORT_SOURCES = [
  "agent-fundamentals",
  "wordkeep",
  "health-overview",
  "iterm-studio",
  "file-cleaner",
  "fileshelf",
  "hyper-top",
  "media-downloader",
  "fors-design-system",
  "forsight",
  "fors",
  "habitus",
  "gh-dashboard",
] as const;
export type SupportSource = (typeof SUPPORT_SOURCES)[number];

/** Stripe's rule for `client_reference_id`; every allowlisted slug must satisfy it. */
export const CLIENT_REFERENCE_ID = /^[A-Za-z0-9_-]{1,200}$/;

export function supportSource(from: string | null | undefined): SupportSource | null {
  return (SUPPORT_SOURCES as readonly string[]).includes(from ?? "") ? (from as SupportSource) : null;
}

/**
 * Where `/donate` sends the visitor: the configured Payment Link, tagged with
 * the source project when it is allowlisted. Returns null when the link is
 * missing or not an https URL — the caller must fail visibly, never fall back
 * to a placeholder.
 */
export function supportRedirectUrl(linkUrl: string | undefined, from: string | null): URL | null {
  if (!linkUrl) return null;
  let target: URL;
  try {
    target = new URL(linkUrl);
  } catch {
    return null;
  }
  if (target.protocol !== "https:") return null;
  const source = supportSource(from);
  if (source) target.searchParams.set("client_reference_id", source);
  return target;
}
