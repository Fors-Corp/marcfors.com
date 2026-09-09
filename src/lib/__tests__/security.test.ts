import { describe, expect, it } from "vitest";
import { parseNpmAudit } from "@/lib/audit";
import {
  CONTENT_SECURITY_POLICY,
  CONTENT_SECURITY_POLICY_DEV,
  SECURITY_HEADERS,
} from "@/lib/securityHeaders";
import { SITE_VERSION } from "@/lib/site";
import { formatGoodCeiling, isVitalPayload, ratingFor } from "@/lib/vitals";
import packageJson from "../../../package.json";

describe("security headers", () => {
  const keys = SECURITY_HEADERS.map((item) => item.key);

  it("ships HSTS, CSP, and clickjacking controls", () => {
    expect(keys).toContain("Strict-Transport-Security");
    expect(keys).toContain("Content-Security-Policy");
    expect(keys).toContain("X-Frame-Options");
    expect(keys).toContain("X-Permitted-Cross-Domain-Policies");
    expect(CONTENT_SECURITY_POLICY).toContain("upgrade-insecure-requests");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("object-src 'none'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("unsafe-eval");
  });

  it("does not allow third-party script or connect origins", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self' 'unsafe-inline'");
    expect(CONTENT_SECURITY_POLICY).toContain("connect-src 'self'");
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/google-analytics|googletagmanager|facebook/i);
  });

  it("only loosens script-src for eval and the analytics debug script in the dev-only CSP variant", () => {
    // The dev variant exists so `next dev`'s eval-based stack reconstruction and
    // @vercel/analytics's debug build (only used off a real Vercel deployment,
    // where it instead loads from the same-origin `/_vercel/insights/script.js`)
    // don't trip the policy; neither addition must ever reach a production build.
    expect(CONTENT_SECURITY_POLICY_DEV).toContain(
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
    );
    const strippedDev = CONTENT_SECURITY_POLICY_DEV.replace(" 'unsafe-eval' https://va.vercel-scripts.com", "");
    expect(strippedDev).toBe(CONTENT_SECURITY_POLICY);
  });
});

describe("npm audit snapshot", () => {
  it("treats high and critical as a failed scan", () => {
    const dirty = parseNpmAudit(
      { metadata: { vulnerabilities: { critical: 1, high: 0, moderate: 2, low: 0, info: 0, total: 3 } } },
      "2026-08-31T00:00:00.000Z",
    );
    expect(dirty.ok).toBe(false);
    expect(dirty.critical).toBe(1);
    expect(dirty.moderate).toBe(2);
  });

  it("treats an empty report as clean", () => {
    const clean = parseNpmAudit({ metadata: { vulnerabilities: { total: 0 } } });
    expect(clean.ok).toBe(true);
    expect(clean.total).toBe(0);
  });
});

describe("web vitals", () => {
  it("accepts a well-formed LCP payload", () => {
    expect(isVitalPayload({ name: "LCP", value: 1200, id: "v1", rating: "good" })).toBe(true);
    expect(isVitalPayload({ name: "LCP", value: -1, id: "v1" })).toBe(false);
    expect(isVitalPayload({ name: "CPU", value: 1, id: "v1" })).toBe(false);
  });

  it("rates CLS against the web-vitals thresholds", () => {
    expect(ratingFor("CLS", 0.05)).toBe("good");
    expect(ratingFor("CLS", 0.2)).toBe("needs-improvement");
    expect(ratingFor("CLS", 0.4)).toBe("poor");
  });

  it("states the good ceiling used in the hover plaque", () => {
    expect(formatGoodCeiling("CLS")).toBe("0.1");
    expect(formatGoodCeiling("LCP")).toBe("2.5 s");
    expect(formatGoodCeiling("INP")).toBe("200 ms");
  });
});

describe("version", () => {
  it("keeps package.json and SITE_VERSION in lockstep", () => {
    expect(packageJson.version).toBe(SITE_VERSION);
  });
});
