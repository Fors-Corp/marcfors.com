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
    upload: {
      ...desktop.ci.upload,
      outputDir: ".lighthouseci/mobile",
    },
  },
};
