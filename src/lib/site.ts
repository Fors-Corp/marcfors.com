export const SITE_HOST = "marcfors.com";
export const SITE_URL = `https://${SITE_HOST}`;
export const SITE_NAME = "Marc Fors";
export const SITE_VERSION = "0.16.1";
/** Release date of the current SITE_VERSION. Feeds sitemap `lastModified` so it stays stable between builds. */
export const RELEASE_DATE = "2026-09-20";
export const DEV_EMAIL = "developer@marcfors.com";
export const GITHUB_USER = "marcfs31";
export const GITHUB_URL = `https://github.com/${GITHUB_USER}`;
/** Org that owns the product repos (transferred from `marcfs31` in Sep 2026). */
export const GITHUB_ORG = "Fors-Corp";
export const GITHUB_ORG_URL = `https://github.com/${GITHUB_ORG}`;
export const SITE_REPO = `${GITHUB_ORG_URL}/marcfors.com`;
export const LINKEDIN_URL = "https://www.linkedin.com/in/marc-fors";

/**
 * The designed CV, served from `public/`. The published copy is redacted: the
 * contact line reads `DEV_EMAIL`, and the phone number on the private original
 * is stripped, so the asset honours the privacy rules in AGENTS.md. Keep both
 * the served path and the download filename here — `next.config.ts` matches the
 * path to relax `frame-ancestors` for the viewer, and `scripts/check-privacy.mjs`
 * scans the file itself.
 */
export const CV_PATH = "/marc-fors-cv.pdf";
export const CV_FILENAME = "Marc-Fors-CV.pdf";

export const BANNED_PUBLIC_PATTERNS = [/@gmail\.com/i, /marcfors\.me/i] as const;

/**
 * Phone shapes that must never reach a published asset (AGENTS.md: "Phone stays
 * off the site and out of git"). Source files are covered by
 * `BANNED_PUBLIC_PATTERNS`; this catches the CV PDF, where the digits live
 * inside a compressed stream and a plain grep would report a false clean.
 */
export const BANNED_PHONE_PATTERNS = [/\+\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\s?\d{2}/, /\+34\b/] as const;
