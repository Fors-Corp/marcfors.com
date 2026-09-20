import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import { CONTENT_SECURITY_POLICY } from "@/lib/securityHeaders";
import { CV_PATH } from "@/lib/site";

async function headerRules() {
  const rules = await nextConfig.headers!();
  return rules;
}

describe("next.config headers()", () => {
  it("applies the security headers to every path", async () => {
    const rules = await headerRules();
    const all = rules.find((r) => r.source === "/:path*");
    expect(all?.headers.map((h) => h.key)).toContain("Content-Security-Policy");
    expect(all?.headers.map((h) => h.key)).toContain("Strict-Transport-Security");
  });

  it("serves the eval-tolerant CSP outside production", async () => {
    // Vitest runs with NODE_ENV=test, i.e. the non-production branch. The strict
    // production value is asserted separately in security.test.ts.
    const rules = await headerRules();
    const csp = rules
      .find((r) => r.source === "/:path*")
      ?.headers.find((h) => h.key === "Content-Security-Policy")?.value;
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("'unsafe-eval'");
  });

  it("adds X-Robots-Tag noindex to /print and /lab, bare and locale-prefixed", async () => {
    const rules = await headerRules();
    const noindex = rules.filter((r) =>
      r.headers.some((h) => h.key === "X-Robots-Tag" && /noindex/.test(h.value)),
    );
    const sources = noindex.map((r) => r.source);
    expect(sources).toEqual(
      expect.arrayContaining(["/print", "/:locale/print", "/lab/:path*", "/:locale/lab/:path*"]),
    );
    // the site root is never tagged noindex
    expect(sources).not.toContain("/:path*");
  });
  it("lets the CV PDF be framed same-origin, and only same-origin", async () => {
    const rules = await headerRules();
    const cv = rules.filter((r) => r.source === CV_PATH);
    expect(cv, `no header rule for ${CV_PATH}`).not.toHaveLength(0);

    const header = (key: string) =>
      cv.flatMap((r) => r.headers).filter((h) => h.key === key).at(-1)?.value;

    // Site-wide these are `frame-ancestors 'none'` / DENY, which would block the
    // PDF from loading in our own /cv iframe. `'self'` still refuses everyone else.
    expect(header("Content-Security-Policy")).toContain("frame-ancestors 'self'");
    expect(header("Content-Security-Policy")).not.toContain("frame-ancestors 'none'");
    expect(header("X-Frame-Options")).toBe("SAMEORIGIN");
    // The viewer relies on <iframe> precisely because this stays shut.
    expect(header("Content-Security-Policy")).toContain("object-src 'none'");
  });

  it("overrides the CV headers after the site-wide rule, so the relaxation wins", async () => {
    const rules = await headerRules();
    const globalAt = rules.findIndex((r) => r.source === "/:path*");
    const cvAt = rules.findIndex((r) => r.source === CV_PATH);
    // Next applies matching rules in order; the last value for a key wins.
    expect(cvAt).toBeGreaterThan(globalAt);
  });

  it("leaves the site-wide frame policy locked down", async () => {
    const rules = await headerRules();
    const csp = rules
      .find((r) => r.source === "/:path*")
      ?.headers.find((h) => h.key === "Content-Security-Policy")?.value;
    expect(csp).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
  });
});
