const desktop = require("./lighthouserc.cjs");

module.exports = {
  ci: {
    ...desktop.ci,
    collect: {
      ...desktop.ci.collect,
      settings: {
        onlyCategories: desktop.ci.collect.settings.onlyCategories,
        chromeFlags: desktop.ci.collect.settings.chromeFlags,
        extraHeaders: desktop.ci.collect.settings.extraHeaders,
        formFactor: "mobile",
        throttlingMethod: "devtools",
        throttling: {
          requestLatencyMs: 562.5,
          downloadThroughputKbps: 1474.56,
          uploadThroughputKbps: 675,
          cpuSlowdownMultiplier: 4,
        },
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    // Same gates as desktop except Total Blocking Time. Under 4x CPU throttling
    // on a shared GitHub runner the best-of-3 TBT for `/` lands anywhere in
    // ~240-290 ms for byte-identical output (PR #110: 266, 279, 287 ms; `main`
    // at 1d12d7c passed), so 250 ms flaked red on unrelated PRs. 350 ms keeps a
    // real regression visible while the 0.9 performance-score gate still applies.
    assert: {
      ...desktop.ci.assert,
      assertions: {
        ...desktop.ci.assert.assertions,
        "total-blocking-time": ["error", { maxNumericValue: 350 }],
      },
    },
    upload: {
      ...desktop.ci.upload,
      outputDir: ".lighthouseci/mobile",
    },
  },
};
