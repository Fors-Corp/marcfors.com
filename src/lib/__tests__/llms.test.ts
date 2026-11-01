import { describe, expect, it } from "vitest";
import { GET } from "@/app/llms.txt/route";
import { llmsTxt } from "@/lib/llms";
import { LOCALES, localeUrl } from "@/lib/locale";
import { SITE_URL } from "@/lib/site";

describe("llms.txt", () => {
  it("states the canonical shop, the repository, and every locale", () => {
    const text = llmsTxt();
    expect(text).toContain("https://www.forsphoto.com");
    expect(text).toContain("https://github.com/Fors-Corp/fors-photography");
    expect(text).toContain("developer@marcfors.com");
    for (const locale of LOCALES) {
      expect(text).toContain(localeUrl(locale, "/", SITE_URL));
    }
    expect(text).not.toMatch(/gmail|\+34/i);
  });

  it("answers as plain text", async () => {
    const response = GET();
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(await response.text()).toContain("# Marc Fors");
  });
});
