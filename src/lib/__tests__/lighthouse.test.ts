import path from "node:path";
import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require(path.resolve(__dirname, "../../../lighthouserc.cjs"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mobile = require(path.resolve(__dirname, "../../../lighthouserc.mobile.cjs"));

describe("lighthouse budget", () => {
  it("runs against a local build, not production", () => {
    expect(config.ci.collect.startServerCommand).toContain("start");
    for (const url of config.ci.collect.url as string[]) {
      expect(url).toMatch(/^http:\/\/localhost:3000\b/);
    }
    expect(config.ci.collect.numberOfRuns).toBeGreaterThanOrEqual(3);
  });

  it("keeps CLS at the good ceiling and gates LCP, TBT and the perf score", () => {
    const a = config.ci.assert.assertions;
    expect(a["cumulative-layout-shift"]).toEqual(["error", { maxNumericValue: 0.1 }]);
    expect(a["largest-contentful-paint"][1].maxNumericValue).toBeLessThanOrEqual(2500);
    expect(a["total-blocking-time"][1].maxNumericValue).toBeLessThanOrEqual(300);
    expect(a["categories:performance"]).toEqual(["error", { minScore: 0.9 }]);
    expect(a["categories:accessibility"]).toEqual(["error", { minScore: 1 }]);
    for (const audit of ["color-contrast", "button-name", "link-name", "label-content-name-mismatch"]) {
      expect(a[audit]).toBe("error");
    }
  });

  it("covers a translated home page and runs the same gates under mobile throttling", () => {
    expect(config.ci.collect.url).toContain("http://localhost:3000/ca");
    expect(mobile.ci.collect.url).toEqual(config.ci.collect.url);
    expect(mobile.ci.collect.numberOfRuns).toBe(3);
    expect(mobile.ci.collect.settings.preset).toBeUndefined();
    expect(config.ci.collect.settings.extraHeaders).toEqual({ "Accept-Language": "en" });
    expect(mobile.ci.collect.settings.extraHeaders).toEqual(config.ci.collect.settings.extraHeaders);
    expect(mobile.ci.collect.settings.formFactor).toBe("mobile");
    expect(mobile.ci.collect.settings.throttlingMethod).toBe("devtools");
    expect(mobile.ci.collect.settings.throttling).toEqual({
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
      cpuSlowdownMultiplier: 4,
    });
    expect(mobile.ci.collect.settings.screenEmulation).toMatchObject({ mobile: true, width: 390, disabled: false });
    expect(mobile.ci.assert).toEqual(config.ci.assert);
    expect(mobile.ci.upload.outputDir).not.toBe(config.ci.upload.outputDir);
  });
});
