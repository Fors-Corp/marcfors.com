import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { SITE_URL } from "@/lib/site";

describe("robots", () => {
  it("allows crawlers to read noindex directives on excluded routes", () => {
    const { rules, sitemap } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toBeUndefined();
    expect(sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
