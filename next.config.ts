import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import {
  CONTENT_SECURITY_POLICY_DEV,
  EMBEDDABLE_ASSET_HEADERS,
  SECURITY_HEADERS,
} from "./src/lib/securityHeaders";
import { CV_PATH } from "./src/lib/site";

// In development, swap the CSP for the eval-tolerant variant so React's dev-only
// stack reconstruction stops tripping the policy. Every other header, and the
// CSP in every non-dev build, is untouched.
const securityHeaders =
  process.env.NODE_ENV === "production"
    ? SECURITY_HEADERS
    : SECURITY_HEADERS.map((header) =>
        header.key === "Content-Security-Policy"
          ? { ...header, value: CONTENT_SECURITY_POLICY_DEV }
          : header,
      );

// Belt-and-braces for the routes that also carry `robots: { index: false }` in
// their metadata: an HTTP header is honoured even when the HTML is never parsed
// (a linked print view, a PDF proxy, a fetch by a naive crawler).
const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
const noindexSources = [
  "/print",
  "/:locale/print",
  "/lab/:path*",
  "/:locale/lab/:path*",
  "/donate/:path*",
  "/:locale/donate/:path*",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // MiniLM / onnxruntime must stay external — bundling them into the Ask route
  // breaks native bindings and blows past the serverless size budget.
  serverExternalPackages: [
    "@huggingface/transformers",
    "onnxruntime-node",
    "onnxruntime-common",
    "sharp",
  ],
  // The Ask route loads MiniLM through onnxruntime-node. Next's tracer does not
  // follow that native require, so the preview function 500s with
  // "Cannot find module 'onnxruntime-node'". Ship only the Linux x64 binding.
  outputFileTracingIncludes: {
    "/api/ask": [
      "./node_modules/onnxruntime-node/package.json",
      "./node_modules/onnxruntime-node/dist/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**/*",
      "./node_modules/onnxruntime-common/**/*",
    ],
    "/api/rag-sources": [
      "./node_modules/onnxruntime-node/package.json",
      "./node_modules/onnxruntime-node/dist/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/**/*",
      "./node_modules/onnxruntime-common/**/*",
    ],
  },
  // Turbopack HMR rejects Origins that are not the server hostname. Local
  // preview often opens http://127.0.0.1:3000 while `next dev` binds as
  // localhost — without this, the WS handshake returns plain "Unauthorized",
  // Chromium reports ERR_INVALID_HTTP_RESPONSE, and client components never
  // hydrate (WordAtlas canvas stuck at the default 300×150 buffer).
  allowedDevOrigins: ["127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...noindexSources.map((source) => ({ source, headers: NOINDEX })),
      // Last rule wins per header key, so this re-sends Content-Security-Policy
      // and X-Frame-Options for the CV alone, letting the /cv <noscript> iframe
      // frame it same-origin. The primary viewer is pdf.js canvas.
      // Anything not listed here (HSTS, nosniff, Referrer-Policy, COOP/CORP…)
      // still comes from the site-wide rule above.
      { source: CV_PATH, headers: EMBEDDABLE_ASSET_HEADERS },
    ];
  },
};

// Case study prose lives in content/work/<slug>/<locale>.mdx, loaded via a
// dynamic `import()` in work/[slug]/page.tsx (never as a routed page.mdx), so
// `pageExtensions` doesn't need to grow — this only registers the bundler
// loader for `.mdx` imports. Frontmatter is a leading `---` YAML block:
// remark-frontmatter parses it, remark-mdx-frontmatter turns it into the
// compiled module's `frontmatter` export and strips it from the rendered
// body. Plugins are passed by string name (not imported function references)
// because Turbopack can't cross a JS function into its Rust compiler.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-frontmatter", "remark-mdx-frontmatter", "remark-gfm"],
  },
});

export default withMDX(nextConfig);
