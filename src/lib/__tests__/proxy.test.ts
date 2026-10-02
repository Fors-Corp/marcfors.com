import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { LOCALE_KEY } from "@/lib/locale";

const srcRoot = path.resolve(__dirname, "../..");

function request(
  url: string,
  init: { headers?: Record<string, string>; cookie?: string } = {},
) {
  const headers = new Headers(init.headers ?? {});
  if (init.cookie) headers.set("cookie", init.cookie);
  return new NextRequest(new URL(url, "http://localhost"), { headers });
}

const localeHeader = (res: Response) => res.headers.get("x-middleware-request-x-locale");
const rewrite = (res: Response) => res.headers.get("x-middleware-rewrite");
const isPassThrough = (res: Response) => res.headers.get("x-middleware-next") === "1";

describe("locale proxy", () => {
  it("lives in proxy.ts, not middleware.ts", () => {
    expect(existsSync(path.join(srcRoot, "proxy.ts"))).toBe(true);
    expect(existsSync(path.join(srcRoot, "middleware.ts"))).toBe(false);
    expect(existsSync(path.resolve(srcRoot, "../middleware.ts"))).toBe(false);
  });

  it("passes API, asset and well-known paths straight through", () => {
    for (const p of ["/api/health", "/_next/static/x.js", "/robots.txt", "/.well-known/security.txt", "/icon.svg"]) {
      const res = proxy(request(p));
      expect(isPassThrough(res), p).toBe(true);
      expect(rewrite(res), p).toBeNull();
      expect(localeHeader(res), p).toBeNull();
    }
  });

  it("rewrites the bare English tree and tags the request locale", () => {
    const res = proxy(request("/work/iterm-studio"));
    expect(isPassThrough(res)).toBe(false);
    expect(rewrite(res)).toBe("http://localhost/en/work/iterm-studio");
    expect(localeHeader(res)).toBe("en");
    expect(res.headers.get("location")).toBeNull();
  });

  it("passes /donate through untouched, whatever the remembered locale", () => {
    const res = proxy(request("/donate?from=fors", { cookie: `${LOCALE_KEY}=es` }));
    expect(isPassThrough(res)).toBe(true);
    expect(rewrite(res)).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it("still localizes the /donate/thanks page", () => {
    const res = proxy(request("/donate/thanks"));
    expect(rewrite(res)).toBe("http://localhost/en/donate/thanks");
    const es = proxy(request("/donate/thanks", { cookie: `${LOCALE_KEY}=es` }));
    expect(new URL(es.headers.get("location")!).pathname).toBe("/es/donate/thanks");
  });

  it("redirects /en/* back to the clean root path", () => {
    const res = proxy(request("/en/print"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/print");
  });

  it("passes a locale-prefixed path through with x-locale set", () => {
    const res = proxy(request("/de/work/iterm-studio"));
    expect(isPassThrough(res)).toBe(true);
    expect(localeHeader(res)).toBe("de");
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects to the remembered-cookie locale without re-setting the cookie", () => {
    const res = proxy(request("/", { cookie: `${LOCALE_KEY}=ca` }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/ca");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("redirects a first visit by Accept-Language and remembers the pick", () => {
    const res = proxy(request("/", { headers: { "accept-language": "es-ES,es;q=0.9,en;q=0.8" } }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/es");
    expect(res.headers.get("set-cookie") ?? "").toContain(`${LOCALE_KEY}=es`);
  });

  it("keeps crawlers on English regardless of Accept-Language", () => {
    const res = proxy(
      request("/", {
        headers: {
          "accept-language": "de-DE,de;q=0.9",
          "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
      }),
    );
    expect(res.headers.get("location")).toBeNull();
    expect(rewrite(res)).toBe("http://localhost/en");
    expect(localeHeader(res)).toBe("en");
  });

  it("does not set a Secure cookie on plain http", () => {
    const res = proxy(request("http://localhost/", { headers: { "accept-language": "pt-PT" } }));
    expect(res.headers.get("set-cookie") ?? "").not.toMatch(/Secure/i);
  });
});
