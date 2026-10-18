# Security and privacy model

What the site does today, as implemented. To report a vulnerability, see [SECURITY.md](../SECURITY.md). The legal and privacy notice shown to visitors is `content/legal/privacy/<locale>.mdx`, served at `/privacy`.

## Shape of the attack surface

The site is a public, read-only portfolio. There are no user accounts, no sessions, no database, no authenticated or state-changing form, and no file uploads. The only server-side writes are log lines. Because of that there are no CSRF tokens: nothing a cross-site request could change exists. The only visitor-controlled input that reaches a server is the JSON body of two beacon endpoints and the `from` query value of `/donate`.

## Response headers

Defined in `src/lib/securityHeaders.ts`, applied to `/:path*` in `next.config.ts`.

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | `default-src 'self'`; `script-src 'self' 'unsafe-inline'`; `style-src 'self' 'unsafe-inline'`; `img-src 'self' data:`; `font-src 'self'`; `connect-src 'self'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`; `upgrade-insecure-requests` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, microphone, geolocation, payment, usb and interest-cohort all disabled |
| `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy` | `same-origin` |
| `X-DNS-Prefetch-Control` | `off` |
| `X-Permitted-Cross-Domain-Policies` | `none` |

Notes:

- `'unsafe-inline'` is present for scripts and styles (Next.js inline bootstrap, the theme anti-flash script, JSON-LD). There are no nonces. `'unsafe-eval'` is never allowed in production. Because inline scripts are allowed, JSON-LD is serialized with `serializeJsonLd` (`src/lib/seo.ts`), which escapes `<` and U+2028/U+2029 so frontmatter text can never close its `<script>` block.
- Development only: `next.config.ts` swaps in `CONTENT_SECURITY_POLICY_DEV`, which adds `'unsafe-eval'` and `https://va.vercel-scripts.com` to `script-src`. Production builds use the strict policy.
- `/marc-fors-cv.pdf` (`CV_PATH`) gets `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` so `/cv` can embed it in an `<iframe>`. Other origins still cannot frame it.
- `/print`, `/lab/*` and `/donate/*` (with and without a locale prefix) also send `X-Robots-Tag: noindex, nofollow`.
- `poweredByHeader` is off.
- `src/lib/__tests__/headers.test.ts` and `security.test.ts` guard these values.

## API routes

All routes are under `src/app/api` except `/donate` and `/.well-known/security.txt`. The proxy skips `/api`, so no locale logic runs on them.

| Route | Method | Protections |
| --- | --- | --- |
| `/api/vitals` | POST | In-memory rate limit of 40 requests per minute per IP; rejects bodies over 2048 bytes with `413`, counted on the streamed bytes (`readJsonBody` in `src/lib/requestBody.ts`), so a chunked request without `Content-Length` is capped too; invalid JSON or shape gives `400`. Accepts only `name` (one of the known vitals), a finite non-negative `value`, `id` (1 to 64 chars) and optional `rating`. Logs one JSON line. |
| `/api/errors` | POST | Rate limit of 20 per minute per IP; 4096 byte limit (same streamed cap); shape check in `src/lib/errors.ts` (`message` 1 to 500 chars, `source` is `client-boundary` or `global-error`, optional `digest` and `url` with length caps). Logs one JSON line. |
| `/api/health` | GET | Read-only, `no-store`. Exposes version, release date, commit SHA, region, security header names and the audit counts. Reports `cookies: "preference-only"` (the locale cookie). No secrets. |
| `/api/github-activity` | GET | No input. Server-side fetch of public GitHub data, 8 second timeout, 5 minute cache. No rate limit of its own; it relies on the CDN cache (`s-maxage=300`) and returns `no-store` only when part of the data is missing. |
| `/donate` | GET | Redirect only. `from` is checked against the `SUPPORT_SOURCES` allowlist; anything else is dropped. Target must be `https`. `no-store`. |
| `/.well-known/security.txt` | GET | Static text with the contact address. |

About the rate limiter (`src/lib/rateLimit.ts`): it is an in-memory sliding window per serverless instance. It resets on cold start and is not shared across instances or regions. The code itself says it is not a security control; it only blunts accidental floods of the beacon endpoints. Once it tracks 10 000 keys it sweeps keys idle for a full window, so one-shot clients cannot grow it without bound. The client IP comes from the first `x-forwarded-for` entry, then `x-real-ip`; Vercel sets that header itself, but behind any other proxy it is client-controlled.

Logged beacon data is limited to the fields listed above. The logs do not record the caller's IP address in the JSON line.

## Environment variables

Every `process.env` read in `src`, plus `next.config.ts`. See [.env.example](../.env.example). None of these is exposed to the browser: the repo uses no `NEXT_PUBLIC_*` variable, and every read below happens in server code.

| Variable | Read in | Server-only | Purpose |
| --- | --- | --- | --- |
| `STRIPE_SUPPORT_LINK_URL` | `src/app/donate/route.ts` | Yes | Payment Link target for `/donate`. A public URL by nature, but kept out of git. |
| `GITHUB_TOKEN` | `src/lib/github.ts`, `src/lib/githubActivity.ts` | Yes | Optional bearer token for GitHub API requests (rate limit only). Never sent to the browser. |
| `GOOGLE_SITE_VERIFICATION` | `src/app/layout.tsx` | Yes (build/render time) | Search Console meta tag value; this value does end up in the public HTML by design. |
| `VERCEL_GIT_COMMIT_SHA`, `GITHUB_SHA` | `src/app/api/health/route.ts` | Yes | Commit shown in `/api/health`. Public by design. |
| `VERCEL_REGION` | `src/app/api/health/route.ts`, `src/instrumentation.ts` | Yes | Region shown in `/api/health` and the boot log. |
| `NEXT_RUNTIME` | `src/instrumentation.ts` | Yes | Set by Next.js; logged at boot. |
| `NODE_ENV` | `next.config.ts` | Build | Selects the production or dev CSP. |

CI-only: `CI` is read by `playwright.config.ts`. Deployment secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are GitHub Actions secrets used by `.github/workflows/production.yml`, not application variables. `.gitignore` excludes `.env*`; `.env.example` is the only env file in the tree.

## What the site stores on the visitor's device

Only choices the visitor makes. There is no cookie banner by design (see `AGENTS.md`); adding anything below this list means adding a consent flow first.

| Item | Type | Written by | Value |
| --- | --- | --- | --- |
| `marcfors-locale` | Cookie, `Path=/`, `Max-Age` one year, `SameSite=Lax`, `Secure` on https | `writeLocale` in `src/lib/prefs.ts`, when the visitor picks a language | A locale code |
| `marcfors-locale` | `localStorage` | Same call | A locale code |
| `marcfors-theme` | `localStorage` | `writeTheme`, when the visitor picks a theme | `system`, `light`, `dark`, `green`, `blue` or `red` |

The locale cookie is not `HttpOnly` because the proxy reads it server-side but client code writes it. `src/proxy.ts` only reads it. `localStorage` access is wrapped in `try/catch`, so private mode degrades to defaults.

## Third-party requests

- From the visitor's browser: none to other origins. The CSP restricts `connect-src`, `img-src`, `font-src` and `script-src` to `'self'` (plus `data:` images). Fonts (Fraunces, IBM Plex Mono) are loaded through `next/font/google`, which downloads and self-hosts them at build time.
- Vercel Web Analytics: `src/app/[locale]/layout.tsx` renders `<Analytics />` from `@vercel/analytics`. On Vercel the script is served from the site's own origin (`/_vercel/insights/...`), so the CSP allows it. The privacy notice describes it as cookie-less, aggregate page-view counting.
- Server-side, from the site's servers: `api.github.com` and `github.com` (activity, contribution calendar, public repo list). No visitor headers or cookies are forwarded.
- Links out (GitHub, LinkedIn, the Stripe Payment Link, case-study live URLs) are ordinary navigations.

## Dependency auditing

- `npm run audit` runs `npm audit --omit=dev --audit-level=high` and fails on high or critical findings in production dependencies. CI runs the same command.
- `scripts/audit-snapshot.mjs` (run by `prebuild`) records counts in `src/generated/audit.json`. `/api/health` and the signal board display that snapshot. It reflects the last build, not the live state.
- `.github/dependabot.yml` is weekly. `.github/workflows/dependabot-automerge.yml` merges only low-risk bumps after CI is green; the rest are labelled `needs-manual-review` (see `.claude/skills/dependabot-triage`). `.github/workflows/codeql.yml` runs CodeQL.

## Privacy checks in the repo

`npm run privacy` (`scripts/check-privacy.mjs`) greps `src`, `content`, `docs`, every root-level Markdown file, `.env.example` and `.grok` for a personal webmail address and the retired `.me` host (the literal patterns live only in the script, so this file cannot trip it), and scans the published CV PDF for those and for phone-number patterns (`BANNED_PHONE_PATTERNS` in `src/lib/site.ts`). The only public mailbox is `developer@marcfors.com`.

## Not present

No authentication, authorization layer, CSRF protection, CORS configuration (the API is same-origin and sends no `Access-Control-*` headers), CSP nonces, CSP violation reporting endpoint, WAF rules in this repo, or persistent logging store.

## Accepted risks and open decisions

Recorded by the 2026-10-18 audit. Each is deliberate or awaiting an owner decision, not an oversight.

| Item | Why it stays for now |
| --- | --- |
| `'unsafe-inline'` in `script-src` | A per-request nonce (set in `src/proxy.ts`, with `'strict-dynamic'`) would make every page render on demand and end static prerendering. Mitigated by having no request-data HTML sink and by `serializeJsonLd`. |
| Dev-only `braces` advisory (GHSA-vfj7-8cjw-p6xm) via `eslint-config-next` → `fast-glob` → `micromatch` | No patched `braces` release exists (`3.0.3` is the latest and is affected). Runs only at lint time on the repo's own globs; nothing ships. npm's suggested fix is a downgrade to `eslint-config-next@14`, which is worse. Revisit when upstream releases a fix. |
| Vercel Web Analytics vs. the "no third-party trackers" rule in `AGENTS.md` | The privacy notice discloses it, but the rule text and the code disagree. Owner decision: remove it (first-party `/api/vitals` already exists) or record it as the one accepted processor. |
| `/api/github-activity` has no rate limit | Successful responses are CDN-cached for 5 minutes; only GitHub outages make it hit upstream per request. |
| Rate limits are per instance | Use Vercel Firewall rate-limit rules if the beacon endpoints ever need a real cross-instance limit. |
