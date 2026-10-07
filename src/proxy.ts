import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isCrawler, isLocale, LOCALE_KEY, preferredLocale, withLocale } from "@/lib/locale";
import { SUPPORT_PATH } from "@/lib/support";

const SKIP =
  /^\/(?:api|_next|icon|apple-icon|opengraph-image|twitter-image|robots\.txt|sitemap\.xml|manifest\.webmanifest|\.well-known)(?:\/|$|\.)/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // `/donate` (exactly) is the tip redirect, the same in every locale; its
  // `/donate/thanks` page is localized like any other.
  if (SKIP.test(pathname) || pathname.includes(".") || pathname === SUPPORT_PATH) {
    return NextResponse.next();
  }

  const first = pathname.split("/").filter(Boolean)[0];

  if (first === DEFAULT_LOCALE) {
    const rest = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    const url = request.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.redirect(url);
  }

  if (isLocale(first)) {
    const headers = new Headers(request.headers);
    headers.set("x-locale", first);
    return NextResponse.next({ request: { headers } });
  }

  const cookie = request.cookies.get(LOCALE_KEY)?.value;
  const remembered = isLocale(cookie) ? cookie : null;
  const fromBrowser = isCrawler(request.headers.get("user-agent"))
    ? DEFAULT_LOCALE
    : preferredLocale(request.headers.get("accept-language"));
  const pick = remembered ?? fromBrowser;

  // The cookie is never written here. A first visit is routed by
  // Accept-Language on every request (deterministic, nothing stored); only an
  // explicit pick in the language switcher persists a locale (`writeLocale`).
  // That keeps `marcfors-locale` a user-chosen preference, which is what exempts
  // it from cookie consent under ePrivacy art. 5(3) — see /privacy.
  if (pick !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = withLocale(pick, pathname);
    return NextResponse.redirect(url);
  }

  const headers = new Headers(request.headers);
  headers.set("x-locale", DEFAULT_LOCALE);
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
