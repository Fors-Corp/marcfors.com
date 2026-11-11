import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LOCALE_KEY, LOCALES, type Locale } from "@/lib/locale";
import { BANNED_PHONE_PATTERNS, BANNED_PUBLIC_PATTERNS, DEV_EMAIL, PRIVACY_UPDATED } from "@/lib/site";
import { THEME_KEY } from "@/lib/theme";

const ROOT = path.join(process.cwd(), "content", "legal", "privacy");
const read = (locale: string) => fs.readFileSync(path.join(ROOT, `${locale}.mdx`), "utf8");
const headings = (body: string) => body.split("\n").filter((line) => line.startsWith("## ")).length;

const ASK_SEES_QUESTION: Record<Locale, string> = {
  en: "The Ask server and Anthropic both see the question.",
  es: "El servidor de Ask y Anthropic ven la pregunta.",
  ca: "El servidor d’Ask i Anthropic veuen la pregunta.",
  it: "Il server di Ask e Anthropic vedono la domanda.",
  pt: "O servidor do Ask e a Anthropic veem a pergunta.",
  de: "Der Ask-Server und Anthropic sehen die Frage.",
  fr: "Le serveur d’Ask et Anthropic voient la question.",
};

const ASK_TRANSCRIPT_NOT_STORED: Record<Locale, string> = {
  en: "This site does not store the transcript.",
  es: "Este sitio no guarda la transcripción.",
  ca: "Aquest lloc no desa la transcripció.",
  it: "Questo sito non conserva la trascrizione.",
  pt: "Este site não guarda a transcrição.",
  de: "Diese Website speichert das Transkript nicht.",
  fr: "Ce site ne conserve pas la transcription.",
};

describe("privacy and legal notice", () => {
  it("dates the Ask and GitHub activity disclosures", () => {
    expect(PRIVACY_UPDATED).toBe("2026-11-11");
  });

  it.each(LOCALES)("%s discloses the first-party GitHub activity endpoint", (locale) => {
    expect(read(locale)).toContain("/api/github-activity");
    expect(read(locale)).toContain("GitHub");
  });

  it.each(LOCALES)("%s discloses portfolio Ask (Neon + Anthropic)", (locale) => {
    const body = read(locale);
    expect(body).toContain("/api/ask");
    expect(body).toContain("Neon");
    expect(body).toContain("Anthropic");
    expect(body).toContain(ASK_SEES_QUESTION[locale]);
    expect(body).toContain(ASK_TRANSCRIPT_NOT_STORED[locale]);
    expect(body).not.toMatch(/end-to-end|bout en bout|Ende-zu-Ende|extremo a extremo|extrem a extrem|ponta a ponta/i);
  });

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
