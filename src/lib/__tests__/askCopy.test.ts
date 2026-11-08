import { describe, expect, it } from "vitest";
import { copy } from "@/data/copy";
import type { UiCopy } from "@/data/copy/types";
import { askChatWidgetStrings, portfolioAskStrings } from "@/lib/askStrings";
import { LOCALES } from "@/lib/locale";

const ASK_KEYS = (Object.keys(copy.en) as (keyof UiCopy)[]).filter((key) =>
  String(key).startsWith("ask"),
);

describe("ask copy drift", () => {
  it("has every English ask key, hand-written, in every shipped locale", () => {
    expect(ASK_KEYS).toEqual(
      expect.arrayContaining([
        "askNav",
        "askTitle",
        "askLede",
        "askPlaceholder",
        "askSubmit",
        "askBusy",
        "askEmpty",
        "askError",
        "askUnavailable",
        "askCitations",
        "askSamplesLabel",
        "askSamples",
        "askSourcesLabel",
        "askSourcesEmpty",
        "askSourcesUnavailable",
        "askWidgetOpen",
        "askWidgetClose",
        "askWidgetLauncher",
      ]),
    );

    for (const locale of LOCALES) {
      for (const key of ASK_KEYS) {
        expect(Object.prototype.hasOwnProperty.call(copy[locale], key), `${locale}.${String(key)}`).toBe(
          true,
        );
        const value = copy[locale][key];
        const english = copy.en[key];
        if (typeof value === "string") {
          expect(value.trim(), `${locale}.${String(key)}`).not.toBe("");
        } else if (Array.isArray(value) && Array.isArray(english)) {
          expect(value, `${locale}.${String(key)}`).toHaveLength(english.length);
          value.forEach((item, index) => {
            expect(typeof item, `${locale}.${String(key)}[${index}]`).toBe("string");
            expect(String(item).trim(), `${locale}.${String(key)}[${index}]`).not.toBe("");
            if (locale !== "en") expect(item).not.toBe(english[index]);
          });
        } else {
          throw new Error(`${locale}.${String(key)} is not ask copy text`);
        }
        if (locale !== "en" && typeof english === "string" && /\s/.test(english)) {
          expect(value, `${locale}.${String(key)}`).not.toEqual(english);
        }
      }
    }
  });

  it("assembles page and widget strings from the page locale", () => {
    for (const locale of LOCALES) {
      const page = portfolioAskStrings(copy[locale]);
      const widget = askChatWidgetStrings(copy[locale]);
      expect(page.title).toBe(copy[locale].askTitle);
      expect(page.lede).toBe(copy[locale].askLede);
      expect(page.placeholder).toBe(copy[locale].askPlaceholder);
      expect(page.submit).toBe(copy[locale].askSubmit);
      expect(page.busy).toBe(copy[locale].askBusy);
      expect(page.empty).toBe(copy[locale].askEmpty);
      expect(page.error).toBe(copy[locale].askError);
      expect(page.unavailable).toBe(copy[locale].askUnavailable);
      expect(page.citations).toBe(copy[locale].askCitations);
      expect(page.samplesLabel).toBe(copy[locale].askSamplesLabel);
      expect(page.samples).toEqual(copy[locale].askSamples);
      expect(page.sourcesLabel).toBe(copy[locale].askSourcesLabel);
      expect(page.sourcesEmpty).toBe(copy[locale].askSourcesEmpty);
      expect(page.sourcesUnavailable).toBe(copy[locale].askSourcesUnavailable);
      expect(widget.open).toBe(copy[locale].askWidgetOpen);
      expect(widget.close).toBe(copy[locale].askWidgetClose);
      expect(widget.launcher).toBe(copy[locale].askWidgetLauncher);
    }
  });
});
