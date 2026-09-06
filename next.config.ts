import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { CONTENT_SECURITY_POLICY_DEV, SECURITY_HEADERS } from "./src/lib/securityHeaders";

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
const noindexSources = ["/print", "/:locale/print", "/lab/:path*", "/:locale/lab/:path*"];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...noindexSources.map((source) => ({ source, headers: NOINDEX })),
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
