# marcfors.com — Grok project rules

This file is the Grok equivalent of a `CLAUDE.md`. Grok loads it automatically. `GROK.md` and `.grok/rules/` repeat the non-negotiables. `CLAUDE.md` points here so Claude follows the same contract.

## What this is

Public personal portfolio for Marc Fors, hosted at **https://marcfors.com**. Observatory / signal-desk visual (ink, brass, paper, signal green). Next.js App Router, React 19, no Tailwind, Fraunces + IBM Plex Mono.

## Privacy (do not leak)

- Public mailbox is **developer@marcfors.com** only.
- Never commit a personal Gmail address, a phone number, or the old `.me` host.
- Git author for this repo: `Marc Fors <developer@marcfors.com>`.
- GitHub user `marcfs31` is public and fine to mention. Private GitHub repos must not be linked.
- Phone stays off the site and out of git. It lives on the CV, nowhere in this tree.

## Facts

- CV is the source of truth (`Marc_Fors_CV_Modern_v3_German.pdf` — English content despite the filename).
- Career break Dec 2025–present. Dynatrace ended Nov 2025. Do not write “currently at Dynatrace”.
- LinkedIn vanity is `linkedin.com/in/marc-fors` (hyphen).

## Stack & UI

- Next.js 16 App Router, React 19, CSS custom properties in `src/app/globals.css`.
- No Tailwind, no shadcn, no hardcoded `bg-emerald-*`.
- Locale is in the URL (`/` English, `/es`, `/de`, …) with `hreflang`. Cookie still remembers the last pick.
- `prefers-reduced-motion` hides the pointer spotlight.
- Copy lives in `src/data/copy/<locale>.ts` (one file per locale: `ui`, `experience`, `careerBreak`, `education`, `languages`); `src/data/copy.ts` is the barrel that assembles the `Record<Locale, …>` maps, plus locale-independent `skills` / `contact` in `src/data/copy/shared.ts`. Featured work in `src/data/projects.ts`. Domain/email constants in `src/lib/site.ts`.
- Case-study prose is MDX: `content/work/<slug>/<locale>.mdx`, one self-contained file per locale (YAML frontmatter — `project`, `stack`, `live`, `repo`, `order`, `description` — plus a free-form body). `src/data/caseStudies.ts` reads frontmatter only, via `gray-matter`; `work/[slug]/page.tsx` dynamically imports the `.mdx` body. Add a study by adding the directory — nothing else to wire up.

## Versioning & git

- SemVer in `package.json` and `CHANGELOG.md`. Tag releases `vX.Y.Z`.
- Conventional commits, subject starts with the version when releasing: `feat: v0.1.0 …`.
- Default branch: `main`.

## Security & observability

- Headers live in `src/lib/securityHeaders.ts` and are applied in `next.config.ts`.
- `/.well-known/security.txt` and `/api/health` are public.
- Web vitals are first-party (`/api/vitals`). Do not add Google Analytics, Meta pixels, or other third-party trackers — they would break the CSP.
- `npm audit` runs at prebuild (snapshot in `src/generated/audit.json`) and in CI at `--audit-level=high`.
- No Vercel cron jobs. Hobby-plan daily-or-coarser only if that ever changes.

## Dependencies

- Dependabot config: `.github/dependabot.yml` (weekly; dev-dep patch/minor and
  actions are grouped into one PR each).
- `.github/workflows/dependabot-automerge.yml` waits for the PR's `ci.yml` run
  to go green, then merges: dev-dependency patch/minor, any github-actions bump,
  and production-dependency **patch**. Everything else gets `needs-manual-review`
  + a comment. It polls the CI run rather than using GitHub native auto-merge —
  `main` has no branch protection, so `--auto` would merge before checks finish.
- `ci.yml`'s "developer mailbox" author check is skipped for `dependabot[bot]`
  and on `push` (merge commits), so a bot PR can actually go green.
- Held bumps (production minor/major, dev-dep major) → follow the
  `dependabot-triage` skill. Prod deps are `next`, `react`, `react-dom`,
  `web-vitals`; keep `@types/node` on the major that matches `engines.node`.

## Commands

```bash
npm run dev            # local
npm test               # Vitest (node + jsdom projects)
npm run test:coverage  # Vitest with v8 coverage + thresholds
npm run test:e2e       # Playwright smoke (builds first, then next start)
npm run typecheck
npm run lint
npm run privacy        # fails if a Gmail address or the old .me host lands in source
npm run build
npm run ci             # privacy + test:coverage + typecheck + lint + audit + build
```

Every copy, project, or privacy change needs a test in the same PR. Component and
hook behaviour lives in `src/**/__tests__/*.test.tsx` / `*.dom.test.ts` (jsdom);
pure logic stays in `*.test.ts` (node). CI is `.github/workflows/ci.yml` — a
`verify` job (checks + Lighthouse budgets against a local build) and an `e2e` job
(Playwright). Lighthouse asserts performance/a11y/SEO scores plus CLS, LCP and TBT.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
