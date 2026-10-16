// Runs against a local production build (see the `lighthouse` CI job) so a
// regression is caught on the PR, not after it ships. The previous config hit
// https://marcfors.com/ — i.e. the last deploy, never the code under review.
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 60000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/ca",
        "http://localhost:3000/de/work/iterm-studio",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        extraHeaders: { "Accept-Language": "en" },
        onlyCategories: ["performance", "accessibility", "seo", "best-practices"],
        chromeFlags: "--no-sandbox --disable-dev-shm-usage --disable-gpu",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.95 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["error", { maxNumericValue: 250 }],
        "resource-summary:script:size": ["warn", { maxNumericValue: 180000 }],
        "color-contrast": "error",
        "button-name": "error",
        "link-name": "error",
        "label-content-name-mismatch": "error",
        "unused-javascript": "off",
        "uses-long-cache-ttl": "off",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci/desktop",
    },
  },
};
