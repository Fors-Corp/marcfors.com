import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALE_KEY, LOCALES } from "@/lib/locale";
import { BANNED_PHONE_PATTERNS, BANNED_PUBLIC_PATTERNS, DEV_EMAIL } from "@/lib/site";
import { THEME_KEY } from "@/lib/theme";

const ROOT = path.join(process.cwd(), "content", "legal", "privacy");
const read = (locale: string) => fs.readFileSync(path.join(ROOT, `${locale}.mdx`), "utf8");
const headings = (body: string) => body.split("\n").filter((line) => line.startsWith("## ")).length;

describe("privacy and legal notice", () => {
  it.each(LOCALES)("has a non-empty %s file", (locale) => {
    const file = path.join(ROOT, `${locale}.mdx`);
    expect(fs.existsSync(file), `${locale}.mdx exists`).toBe(true);
    expect(read(locale).trim().length).toBeGreaterThan(0);
  });

  it.each(LOCALES)("%s has the same section count as English", (locale) => {
    expect(headings(read(locale))).toBe(headings(read("en")));
  });

  it.each(LOCALES.filter((l) => l !== "en"))("%s is translated, not a copy of English", (locale) => {
    expect(read(locale).trim()).not.toBe(read("en").trim());
  });

  it.each(LOCALES)("%s names what the site actually stores and who processes it", (locale) => {
    const body = read(locale);
    for (const needle of [LOCALE_KEY, THEME_KEY, DEV_EMAIL, "Vercel", "Stripe", "aepd.es", "/api/vitals"]) {
      expect(body, `${locale} mentions ${needle}`).toContain(needle);
    }
  });

  it.each(LOCALES)("%s leaks no banned address, host or phone number", (locale) => {
    const body = read(locale);
    for (const pattern of [...BANNED_PUBLIC_PATTERNS, ...BANNED_PHONE_PATTERNS]) {
      expect(body, `${locale} matches ${pattern}`).not.toMatch(pattern);
    }
  });

  it("addresses Do Not Track and Global Privacy Control in English", () => {
    const body = read("en");
    expect(body).toContain("Do Not Track");
    expect(body).toContain("Global Privacy Control");
  });
});
