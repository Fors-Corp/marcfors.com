export const SITE_HOST = "marcfors.com";
export const SITE_URL = `https://${SITE_HOST}`;
export const SITE_NAME = "Marc Fors";
export const SITE_VERSION = "0.12.1";
/** Release date of the current SITE_VERSION. Feeds sitemap `lastModified` so it stays stable between builds. */
export const RELEASE_DATE = "2026-09-06";
export const DEV_EMAIL = "developer@marcfors.com";
export const GITHUB_USER = "marcfs31";
export const GITHUB_URL = `https://github.com/${GITHUB_USER}`;
export const SITE_REPO = `${GITHUB_URL}/marcfors.com`;
export const LINKEDIN_URL = "https://www.linkedin.com/in/marc-fors";

export const BANNED_PUBLIC_PATTERNS = [/@gmail\.com/i, /marcfors\.me/i] as const;
