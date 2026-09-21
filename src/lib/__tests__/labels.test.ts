import { describe, expect, it } from "vitest";
import { copy } from "@/data/copy";
import { linkLabel } from "@/lib/labels";
import { LOCALES } from "@/lib/locale";

// The three per-project aria-label templates exist to satisfy WCAG 2.4.9 —
// seven "SOURCE" links to seven different repos previously shared one
// accessible name. Overriding an accessible name is easy to get wrong twice
// over, so both failure modes are pinned here.
const PAIRS = [
  ["sourceFor", "source"],
  ["liveFor", "live"],
  ["caseStudyFor", "caseStudy"],
] as const;

describe("link labels", () => {
  it("substitutes the project name", () => {
    expect(linkLabel("Source code for {project}", "fileshelf")).toBe("Source code for fileshelf");
  });

  it("leaves a template without the slot untouched", () => {
    expect(linkLabel("Source code", "fileshelf")).toBe("Source code");
  });

  it("keeps the {project} slot in every locale", () => {
    for (const locale of LOCALES) {
      for (const [template] of PAIRS) {
        expect(copy[locale][template], `${locale}.${template}`).toContain("{project}");
      }
    }
  });

  // WCAG 2.5.3 Label in Name: an aria-label replaces the accessible name
  // outright, so a speech-input user saying the word they can SEE ("click
  // source") only reaches the link if that word survives inside the override.
  it("keeps the visible label inside the accessible name in every locale", () => {
    for (const locale of LOCALES) {
      for (const [template, visible] of PAIRS) {
        expect(
          copy[locale][template].toLowerCase(),
          `${locale}: "${copy[locale][template]}" must contain the visible "${copy[locale][visible]}"`,
        ).toContain(copy[locale][visible].toLowerCase());
      }
    }
  });

  it("translates the templates rather than leaving English in place", () => {
    for (const locale of LOCALES.filter((l) => l !== "en")) {
      for (const [template] of PAIRS) {
        expect(copy[locale][template], `${locale}.${template}`).not.toBe(copy.en[template]);
      }
    }
  });
});
