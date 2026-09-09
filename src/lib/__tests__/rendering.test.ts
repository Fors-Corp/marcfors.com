import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(path.join(srcRoot, rel), "utf8");

/**
 * These are invariant guards, not behaviour tests: the localized pages are only
 * statically prerendered while nothing in the shared render tree (root layout,
 * root not-found) touches a per-request API. A regression here silently turns the
 * whole site dynamic again — exactly the bug this refactor fixed.
 */
describe("static rendering invariants", () => {
  it("keeps the root layout a request-independent pass-through", () => {
    const layout = read("app/layout.tsx");
    expect(layout).not.toMatch(/\bheaders\s*\(/);
    expect(layout).not.toMatch(/\bcookies\s*\(/);
    expect(layout).not.toMatch(/["'`]use client["'`]/);
    expect(layout).toMatch(/return children/);
  });

  it("keeps the single 404 surface static (no dynamic APIs)", () => {
    const notFound = read("app/not-found.tsx");
    expect(notFound).not.toMatch(/\bheaders\s*\(/);
    expect(notFound).not.toMatch(/\bcookies\s*\(/);
    // It renders its own shell because the root layout no longer provides one.
    expect(notFound).toMatch(/<html/);
    expect(notFound).toMatch(/<body/);
  });

  it("moves the html/body shell and locale into the [locale] layout", () => {
    const localeLayout = read("app/[locale]/layout.tsx");
    expect(localeLayout).toMatch(/<html lang=\{locale\}/);
    expect(localeLayout).toMatch(/<body/);
    expect(localeLayout).toContain("ANTI_FLASH_SCRIPT");
    expect(localeLayout).toContain("application/ld+json");
    expect(localeLayout).toContain("generateStaticParams");
  });

  it("wires up first-party Vercel Web Analytics from the [locale] layout", () => {
    const localeLayout = read("app/[locale]/layout.tsx");
    expect(localeLayout).toContain('from "@vercel/analytics/next"');
    expect(localeLayout).toMatch(/<Analytics\s*\/>/);
  });

  it("exports an adaptive theme-color viewport", () => {
    const localeLayout = read("app/[locale]/layout.tsx");
    expect(localeLayout).toMatch(/export const viewport: Viewport/);
    expect(localeLayout).toContain("(prefers-color-scheme: dark)");
    expect(localeLayout).toContain("(prefers-color-scheme: light)");
  });

  it("ships a global-error boundary with its own html/body", () => {
    const globalError = read("app/global-error.tsx");
    expect(globalError).toMatch(/["'`]use client["'`]/);
    expect(globalError).toMatch(/<html/);
    expect(globalError).toMatch(/<body/);
    expect(globalError).toContain("reset");
  });
});
