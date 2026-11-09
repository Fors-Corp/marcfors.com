import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { AI_CRAWLERS } from "@/lib/aiCrawlers";
import { SITE_URL } from "@/lib/site";

describe("robots", () => {
  it("allows crawlers to read noindex directives on excluded routes", () => {
    const { rules, sitemap } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toBeUndefined();
    expect(sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(robots().host).toBe(SITE_URL);
  });

  it("names AI search, user-fetch and training crawlers and allows them", () => {
    const rules = [robots().rules].flat();
    const ai = rules.find((rule) => Array.isArray(rule.userAgent));
    expect(ai?.userAgent).toEqual([...AI_CRAWLERS]);
    expect(ai?.allow).toBe("/");
    expect(ai?.disallow).toBeUndefined();
    for (const bot of ["OAI-SearchBot", "ChatGPT-User", "GPTBot", "ClaudeBot", "Claude-User", "PerplexityBot", "Google-Extended"]) {
      expect(AI_CRAWLERS).toContain(bot);
    }
  });

  it("never disallows anything", () => {
    for (const rule of [robots().rules].flat()) expect(rule.disallow).toBeUndefined();
  });
});
