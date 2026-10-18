# marcfors.com

Personal site for Marc Fors. Observatory desk. Locales: `/` English, `/es`, `/ca`, `/it`, `/pt`, `/de`, `/fr`. Print CV at `/print`. Case studies live under `/work/<slug>`; the slugs are the directories in `content/work/`.

### GitHub activity

The homepage shows `marcfs31`'s recent public pushes, pull requests, issues and
releases, plus the public profile's contribution calendar. It loads when near
the viewport and refreshes every five minutes while visible (paused in hidden
tabs). GitHub can delay public events; this is a cached feed, not a real-time
websocket. The calendar follows GitHub's profile settings and can include
anonymous private contribution counts, never private repository details.
Daily counts are also available as text, not just heatmap colors.

`/api/github-activity` fetches GitHub server-side with five-minute caching,
timeouts, independent feed/calendar error handling and an explicit unavailable
state. No visitor headers/cookies are forwarded and no third-party assets or
scripts are loaded. `GITHUB_TOKEN` is optional for the public-events API rate
limit; keep it server-only, never `NEXT_PUBLIC_*`. No token is needed for the
calendar: only dates/counts/intensity are parsed from GitHub's public HTML
fragment. A markup change fails visibly rather than embedding remote HTML or
fabricating zero activity. No cron or deployment configuration is required.

Source: [github.com/Fors-Corp/marcfors.com](https://github.com/Fors-Corp/marcfors.com). Live: [marcfors.com](https://marcfors.com).

The CV is the source of truth for employment, education, skills and languages. GitHub supplies the live public-repo list. Public repositories get a source link; private work is listed without exposing the repo.

Recruiters and custom-app inquiries: [developer@marcfors.com](mailto:developer@marcfors.com).

## Docs

- [docs/architecture.md](docs/architecture.md): request flow, data layout, build steps
- [docs/security.md](docs/security.md): headers, API protections, env vars, what is stored
- [docs/contributing.md](docs/contributing.md): setup, scripts, tests, how to add a locale or case study
- [SECURITY.md](SECURITY.md): reporting a vulnerability
- [AGENTS.md](AGENTS.md): project rules for contributors and coding agents

## Run

Requires Node.js 22+. See [.env.example](.env.example) for the optional environment variables.

```bash
npm install
npm run dev
```

```bash
npm test           # unit + component (Vitest: node + jsdom)
npm run test:e2e   # Playwright smoke against a local production build
npm run ci         # privacy + coverage + typecheck + lint + audit + build
```

CI also runs Lighthouse against the local production build in desktop and throttled mobile modes (390px), covering English and Catalan home pages and a German case study. Mobile uses applied DevTools Slow 4G networking and 4× CPU throttling, measuring browser paint timings rather than estimating them with Lantern simulation. Both configurations require 100% accessibility, ≥90% performance/SEO, CLS ≤0.1, LCP ≤2.5s and TBT ≤250ms. Reports are stored separately under `.lighthouseci/desktop` and `.lighthouseci/mobile`. Run `npx --yes @lhci/cli@0.15.1 autorun` and `npx --yes @lhci/cli@0.15.1 autorun --config=lighthouserc.mobile.cjs` after a build to reproduce them. Playwright additionally checks technology-label wrapping and touch targets at 320, 390, 768 and 1280px, keyboard skip navigation and reduced motion.

## Architecture

The desk is a Server Component tree with small client islands. Locale lives in the URL, handled by `src/proxy.ts`. Copy is one file per locale under `src/data/copy/`, case studies are MDX under `content/work/`, and theme colours are generated from one source file. See [docs/architecture.md](docs/architecture.md) for the full picture.

## Domain (`marcfors.com`)

GitHub Actions CI runs on every push. Production deploys through `.github/workflows/production.yml` once these GitHub secrets exist:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

You still have to do the parts that sit on your accounts:

1. In Vercel → Project → Domains, add `marcfors.com` and `www.marcfors.com`.
2. At the domain registrar:

   - `A` `@` → `76.76.21.21`
   - `CNAME` `www` → `cname.vercel-dns.com`

TLS certificates are issued by Vercel after DNS answers correctly.

## Support link (`/donate`)

Every Fors-Corp project links to `https://marcfors.com/donate?from=<repo-slug>`. [`src/app/donate/route.ts`](src/app/donate/route.ts) answers with a `302` to the Stripe Payment Link, adding `client_reference_id=<slug>` when the slug is on the allowlist in [`src/lib/support.ts`](src/lib/support.ts) (unknown or missing → untagged). Stripe's after-payment redirect lands on `/donate/thanks`, localized and `noindex`. Visible copy says **Support · 1,99 €**, never "donate": these are tips to an individual, not charitable donations.

The Payment Link URL lives only in one env var — never in git:

| Var | Preview / Development | Production |
| --- | --- | --- |
| `STRIPE_SUPPORT_LINK_URL` | test-mode link (`https://buy.stripe.com/test_…`) | live-mode link |

```bash
vercel env add STRIPE_SUPPORT_LINK_URL production
```

If it is unset or not `https`, `/donate` returns `500` and logs `[donate] STRIPE_SUPPORT_LINK_URL is unset…` instead of redirecting anywhere else.

## Agents

`AGENTS.md` is the contract; `CLAUDE.md` and `GROK.md` point at it. `.grok/rules/` repeats the non-negotiables, `.grok/skills/` holds `signal-desk`, `portfolio-locales` and `portfolio-launch`, and `.claude/skills/` holds `dependabot-triage`.
