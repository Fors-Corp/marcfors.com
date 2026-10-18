# Contributing

Project rules (privacy, facts, stack) are in [AGENTS.md](../AGENTS.md). Read the Privacy section before your first commit.

## Local setup

Requires Node.js 22 or newer (`engines.node` in `package.json`; CI uses Node 22). There is no `.nvmrc`.

```bash
npm ci
npm run dev        # http://localhost:3000
```

No environment variables are required to run the site. Copy `.env.example` to `.env.local` if you need the optional ones (see [security.md](security.md)). `/donate` returns `500` until `STRIPE_SUPPORT_LINK_URL` is set; that is expected.

`next dev` regenerates the agent-instructions block in `AGENTS.md`. If it shows up in your diff, commit it with your work.

## npm scripts

| Script | What it does |
| --- | --- |
| `dev` | `next dev` |
| `build` | `next build` (runs `prebuild` first) |
| `start` | `next start` on an existing build |
| `prebuild` | Runs `gen-tokens.mjs` then `audit-snapshot.mjs` |
| `gen:tokens` | Regenerates `src/app/styles/tokens.css` from `src/lib/themePalettes.ts` |
| `lint` | `eslint src` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run` (node and jsdom projects) |
| `test:coverage` | `vitest run --coverage`; fails under the thresholds in `vitest.config.ts` (lines 75, functions 78, branches 76, statements 80) |
| `test:e2e` | `playwright test`; `pretest:e2e` builds first |
| `privacy` | `node scripts/check-privacy.mjs`; fails on a Gmail address, the old `.me` host, or phone patterns in the CV |
| `audit` | `npm audit --omit=dev --audit-level=high` |
| `ci` | `privacy`, `test:coverage`, `typecheck`, `lint`, `audit`, `build`, in that order |

Lighthouse budgets are not an npm script. CI runs `npx --yes @lhci/cli@0.15.1 autorun` and the same with `--config=lighthouserc.mobile.cjs` after a build.

## Tests

| Where | Project | Environment |
| --- | --- | --- |
| `src/**/*.test.ts` (not `.dom.test.ts`) | `node` | Node |
| `src/**/*.test.tsx`, `src/**/*.dom.test.ts` | `dom` | jsdom, setup in `src/test/setup.ts` |
| `e2e/*.spec.ts` | Playwright | `chromium` (desktop), plus `mobile` (Pixel 7) for `mobile.spec.ts`; boots `next start` on port 3000 |

Put pure logic in `*.test.ts`, component and hook behaviour in `*.test.tsx` or `*.dom.test.ts`. Route tests sit next to the route (`route.test.ts`). `src/components/WordAtlas.tsx` is excluded from coverage and exercised by e2e.

Every copy, project or privacy change needs a test in the same PR. Several guard tests do this for you: `copy.test.ts` (locale keys in lockstep), `copyUsage.test.ts` (no dead keys), `caseStudies.test.ts`, `tokens.test.ts`, `clientBundle.test.ts`, `headers.test.ts`.

## How to

### Add a locale

1. In `src/lib/locale.ts`, add the code to `LOCALES`, `LOCALE_CODES`, `LOCALE_LABELS` (native name) and `OG_LOCALES`.
2. Create `src/data/copy/<locale>.ts` exporting `ui`, `experience`, `careerBreak`, `education` and `languages`; import and register it in each map in `src/data/copy.ts`.
3. Add that locale to every `blurb` in `src/data/projects.ts` (`featured` and `lab`).
4. Add `content/work/<slug>/<locale>.mdx` for every case study and `content/legal/privacy/<locale>.mdx`.
5. Update the `Preferred-Languages` line in `src/app/.well-known/security.txt/route.ts` if you want it listed.
6. Run `npm test`; the copy, case-study, legal and project tests fail until everything is complete.

The proxy, sitemap, OG images and language switcher read `LOCALES`, so they need no edit.

### Add a case study

Create `content/work/<new-slug>/<locale>.mdx` for every locale. Each file starts with frontmatter:

```yaml
---
project: "Name"
stack:
  - "React"
live: "https://example.com"   # optional
repo: "https://github.com/..." # optional; omit for private source
order: 5
description: "One locale-specific sentence for meta and OG tags."
---
```

Then write the body (the existing studies use `## Problem`, `## Approach`, `## Result`). `generateStaticParams` and the sitemap enumerate the directory. `caseStudies.test.ts` requires frontmatter to match English except `description`, and a translated body in every locale. Do not link private repositories.

### Add a featured project

Add an entry to `featured` in `src/data/projects.ts` with `name`, a `blurb` for every locale, and `stack`. Optional fields: `repo`, `live`, `href`, `caseStudy` (a case-study slug), `private`, `spotlight`. For a project that tips can be attributed to, add its slug to `SUPPORT_SOURCES` in `src/lib/support.ts`. Add icon mappings for new technology names in `src/lib/technologyIcons.ts`.

### Add a copy key

1. Add the key to `UiCopy` in `src/data/copy/types.ts`.
2. Add it to every `src/data/copy/<locale>.ts`, translated by hand.
3. Read it from a Server Component through `copy[locale]`. Client components must receive the string as a prop.
4. Run `npm test`. A key nothing reads fails `copyUsage.test.ts`.

## Commits, versions, changelog

- Conventional commits (`feat`, `fix`, `docs`, `test`, `chore`, ...). Releases start the subject with the version, for example `feat: v0.1.0 ...`.
- Git author: `Marc Fors <developer@marcfors.com>`. CI fails a pull request whose head commit author is not `@marcfors.com` or is a Gmail address.
- SemVer. Releasing means bumping `version` in `package.json` and `SITE_VERSION` (and `RELEASE_DATE`) in `src/lib/site.ts` together, adding a `CHANGELOG.md` section, and tagging `vX.Y.Z`. Day-to-day changes go under `## Unreleased`.
- Changing what the site stores, sends or embeds means updating `content/legal/privacy/<locale>.mdx` in the same PR and bumping `PRIVACY_UPDATED` in `src/lib/site.ts`.
- Default branch is `main`. Dependabot behaviour is described in AGENTS.md.

## Before you open a PR

- [ ] `npm run ci` passes (privacy, coverage, typecheck, lint, audit, build)
- [ ] New or changed copy, projects or privacy behaviour has a test
- [ ] All seven locales updated for any copy, project blurb or case-study change
- [ ] No Gmail address, phone number or old `.me` host anywhere
- [ ] `CHANGELOG.md` updated under `## Unreleased`
- [ ] `npm run test:e2e` if you touched layout, navigation or the atlas
