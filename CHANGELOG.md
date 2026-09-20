# Changelog

All notable changes to this project are versioned with [SemVer](https://semver.org/).

## 0.16.0 — 2026-09-20

### The CV, on the site

- **New `/cv` page in all six locales**: the designed CV PDF rendered inline,
  with a download button and an open-in-new-tab link. Reachable from the hero
  CTA row and the footer, listed in the sitemap with the full hreflang set, and
  indexable — unlike `/print`, which stays out of the index because it only
  restates the home page.
- **The published PDF is redacted.** The private original carries a phone
  number and a personal Gmail address; AGENTS.md keeps both off the site and out
  of git. `public/marc-fors-cv.pdf` has the contact line rewritten to
  `developer@marcfors.com`, right-aligned to the original margin, and the phone
  removed. The original is untouched on disk and stays out of the repo.
- **`frame-ancestors` relaxed for that one asset.** The site-wide
  `frame-ancestors 'none'` / `X-Frame-Options: DENY` would have blocked the PDF
  from loading in its own same-origin viewer. `EMBEDDABLE_ASSET_HEADERS` sends
  `'self'` / `SAMEORIGIN` for `/marc-fors-cv.pdf` only; every other header, and
  every other path, is unchanged. `object-src 'none'` stays shut, which is why
  the viewer is an `<iframe>` and not an `<object>`.
- **The privacy gate now reads published assets.** `npm run privacy` only
  grepped source, with `-I` skipping binaries — a PDF in `public/` holding a
  phone number passed clean. It now decodes PDF streams (Flate *and* ASCII85,
  the filter stack that hid the leak in the first place) and scans the text.
  Extracted into `scripts/lib/`, so the unit tests exercise the same code CI runs.

## 0.15.0 — 2026-09-20

### Fors Corp alignment

Brings the site in line with the AI CV (`Marc_Fors_CV_AI_v2.pdf`), LinkedIn
and GitHub after the product repos moved to the `Fors-Corp` org.

- **Title and metadata say "AI software engineer"**: page title, description,
  OpenGraph/Twitter alt text, manifest and JSON-LD (`jobTitle`, `worksFor`
  Fors Corp, `knowsAbout`, `seeks`). Link previews on LinkedIn no longer read
  "Frontend software engineer".
- **New tagline** in all six locales: "I ship complete products with LLM
  agents — and gate every line they write."
- **Current role reads "Fors Corp · independent practice"** in every locale.
- **mlaas is now LMaaS**, one entry covering local LLM serving over an
  OpenAI-compatible API plus ML training and retraining; proof line updated.
- **forsight is described as the observability platform** it now is (Go agent,
  ML anomaly scoring, React library) and **Fors Design System gets its own
  card**. Both link to `github.com/Fors-Corp/…` and to their org Pages sites —
  the old `marcfs31.github.io/forsight/` link had started returning 404.
- `SITE_REPO` points at `Fors-Corp/marcfors.com`; tests cover the org links,
  the LMaaS rename and the new copy.

## 0.14.0 — 2026-09-14

### AI positioning and automatic project discovery

Repositioned the site from "frontend software engineer" to "AI software
engineer" across all six locales (`src/data/copy/*.ts`) — the pitch is now
running an LLM-agent delivery team (Claude Code, Codex, Cursor, Grok) against
versioned rules and MCP servers, not just shipping React. `now`, `headline`,
`lede`, `hits`, `hirePathLede` and `careerBreak.body` all updated in parallel
across locales; unchanged by `copyUsage.test.ts` and `clientBundle.test.ts`.

- **Four new featured projects** (`src/data/projects.ts`), backing the new
  pitch with evidence instead of just claiming it: `mlaas` (a self-retraining
  ML-as-a-Service behind a Go API, private, spotlight), `forsight` (the
  observability design system these products share, public, spotlight),
  `GH Dashboard` and `Business Manager` (private, supporting tier). Private
  entries get `live` + `private: true` with no `repo`, matching the existing
  rule that private repos are never linked.
- **The public-repo feed now requires a live homepage.** `isListedRepo`
  (`src/lib/github.ts`) previously auto-listed any non-fork, non-skipped
  repo with a description or language — including one-off CLI experiments
  and coursework with nothing running anywhere. It now also requires
  `repo.homepage`, so the auto-discovered "Attic" feed only ever surfaces
  repos that actually serve something live, the same bar the hand-curated
  `featured` list already held itself to.

## 0.13.1 — 2026-09-10

### Lighthouse pass: font preload weight and repeated link names

Triaged the full mobile Lighthouse report (13.4.1) against the live site.
Seven flagged dimensions, five of which are deliberately left alone — the
reasoning is recorded here so they don't get "fixed" again later:

- **Font preload trimmed to the `latin` subset.** `app/[locale]/layout.tsx`
  asked `next/font` for `["latin", "latin-ext"]` on both Fraunces and IBM
  Plex Mono, which preloaded six woff2 files (108,020 B) at High priority
  ahead of the JS chunks. Every glyph the six shipped locales actually render
  — es/ca/it/pt/de accents, Catalan's U+00B7 middot — lives in `latin`;
  `latin-ext` is Central/Eastern European. Verified by scanning every string
  in `src/data/copy/**`, `src/data/projects.ts` and `content/work/**/*.mdx`
  for codepoints in `latin-ext` but not `latin`: zero hits across 129 files.
  Now 3 preloads / 56,672 B, a 51,348 B cut to the critical path, which is
  where the LCP score loss lives (LCP 2029 ms was 466 ms element render
  delay). Fail-safe rather than a gamble: `next/font` still emits the
  `latin-ext` `@font-face` rules with their `unicode-range`, so a stray
  character degrades to a lazy fetch instead of tofu. Guarded by
  `src/lib/__tests__/fontSubset.test.ts`.
- **Kept IBM Plex Mono weight 500.** Dropping it would have removed two more
  files, but `globals.css` sets `body { font-family: var(--mono) }` with
  `font-synthesis: none`, so a missing 500 renders as 400 with no faux-bold —
  a silent visual regression, not an optimisation. The guard test pins this.
- **Per-project accessible names on repeated links (WCAG 2.4.9).** `SOURCE`,
  `LIVE` and `CASE STUDY` are re-rendered once per project, so seven "Source"
  links pointed at four different repos under one accessible name (axe reports
  this as `incomplete`, which is why the existing blanket axe scan never
  caught it). Added `sourceFor`/`liveFor`/`caseStudyFor` aria-label templates
  to all six locale files plus `linkLabel()` in `src/lib/labels.ts`. Visible
  copy, DOM text and layout are untouched, and each template keeps the visible
  word inside the accessible name so WCAG 2.5.3 (Label in Name) still holds —
  pinned per locale by `src/lib/__tests__/labels.test.ts`. `Desk.test.tsx`
  gains the real invariant (same accessible name implies same destination),
  verified to fail without the labels.

Deliberately not changed:

- **`legacy-javascript` (est. 14,010 B).** The flagged polyfills are
  `next/dist/build/polyfills/polyfill-module.js`, `require()`d unconditionally
  by Next's own App Router client entry (`next/dist/client/app-globals.js`) —
  not app code, and not the `nomodule` bundle (that is a separate chunk).
  A `browserslist` key cannot remove it: with no config Next already uses
  `MODERN_BROWSERSLIST_TARGET` (chrome 111 / edge 111 / firefox 111 /
  safari 16.4, i.e. "baseline widely available"), so pinning it changes
  nothing today and only stops future Next baseline advances reaching this
  project. Two builds with different browserslist targets produced a
  byte-identical JS chunk. The real block is 1,376 B raw / 440 B gzip, not
  14,010 B — Lighthouse quotes a fixed per-signature core-js cost table. It
  also defines `URL.canParse` (Chrome 120+/Safari 17+), so aliasing it away
  would break Chrome 111–119 and Safari 16.4, inside Next's own support matrix.
- **CSP `script-src 'unsafe-inline'`.** Removing it needs a per-request nonce,
  which would convert all 58 prerendered pages to on-demand SSR. Hashes are
  impractical because Next emits per-page `self.__next_f.push(...)` flight
  payload scripts. `csp-xss` is zero-weighted and best-practices already
  scores 1.0.
- **Trusted Types.** Informative, weight 0, and the site injects the
  anti-flash theme script and JSON-LD via `dangerouslySetInnerHTML`; the
  directive risks breaking hydration in Chrome for no score movement.
- **Render-blocking CSS / critical chain.** Both audits report zero FCP and
  zero LCP savings. Inlining the two stylesheets measured *worse*
  (+4,987 B brotli per document, ~+24 ms on Lighthouse's mobile throttle).
- **Total Blocking Time 264 ms.** ~232 ms of it is a Bitwarden extension in
  the auditing browser, not the site; the CI configuration measures 0 ms with
  zero long tasks. The `unminified-javascript` and `unused-javascript` audits
  are 100% that same extension.

## 0.13.0 — 2026-09-09

### Vercel Web Analytics

- Added `@vercel/analytics` (zero transitive dependencies) and mounted
  `<Analytics />` in `app/[locale]/layout.tsx`, next to the existing
  `ANTI_FLASH_SCRIPT`/JSON-LD tags. In production it only ever talks to the
  same-origin `/_vercel/insights/*` paths Vercel's edge proxies, so the
  strict production CSP (`src/lib/securityHeaders.ts`) is untouched — no
  third-party origin is allowed there. `next dev` is the one case that
  differs: outside a real Vercel deployment the package falls back to loading
  its debug build from `va.vercel-scripts.com`, so that host is allowlisted
  only in the existing dev-only CSP variant, alongside the pre-existing
  `unsafe-eval` allowance for React's dev stack reconstruction.
- This is Vercel's own first-party analytics (enabled per-project on Vercel,
  not a third-party pixel), so it doesn't conflict with the existing
  first-party `/api/vitals` reporting or the no-third-party-trackers rule.
- Verified: `npm run ci` green; manually checked in the dev preview that the
  CSP no longer blocks the analytics script and no console errors remain.

## 0.12.1 — 2026-09-08

### Vitest 5

- `vitest` and `@vitest/coverage-v8` 3.2.7 → 5.0.0 (Dependabot #24/#25). Root
  cause of the coverage regression Dependabot's bump kept tripping (held at
  the v4 line too, in #3/#13): `@vitest/coverage-v8`'s v8-to-istanbul
  remapping got substantially more granular between v3 and v4/5 — confirmed
  by diffing raw `coverage-final.json` branch/function/statement counts
  file-by-file across both versions, not just the aggregate percentages.
  Most files shifted a little in either direction and roughly cancelled out;
  `WordAtlas.tsx` alone didn't — its branch-point count went from 6 to 91 for
  the same source, because the newer tooling now separately instruments
  closures inside `useEffect` that the old remapping counted far more
  coarsely. That's the exact code this project's own `vitest.config.ts`
  comment already flagged as real-canvas-only and meant to be verified by
  Playwright, not vitest — so it moves from "sits a little below the other
  metrics" to an explicit `coverage.exclude` entry, with the reasoning kept
  in the config comment. Coverage thresholds are recalibrated against the
  real (more accurate) v5 baseline: lines 75, statements 80, functions 78,
  branches 76 — all with real margin, not shipped at the edge.
- `vitest.config.ts`: `__dirname` → `import.meta.dirname` (vitest 5's native
  config loader deprecation warning).
- Verified: `npm run ci` and `npm run test:e2e` green; the Wordkeep Atlas's
  actual click/drag/touch behavior is still covered — by the e2e suite, which
  is what was already exercising it.

## 0.12.0 — 2026-09-06

### MDX case studies

- Case-study prose moves from hand-written TS objects into MDX:
  `content/work/<slug>/<locale>.mdx`, one self-contained file per locale —
  YAML frontmatter (`project`, `stack`, `live`, `repo`, `order`, `description`)
  plus a free-form prose body. `problem`/`approach`/`result` are no longer
  fixed fields; they're just headings a study writes for itself; the
  `wordkeep`/`habit-breaker`/`iterm-studio` studies migrated verbatim,
  including their headings translated into all six locales.
- `@next/mdx` (+ `remark-frontmatter`, `remark-mdx-frontmatter`, `remark-gfm`,
  all as Turbopack-compatible string plugin refs) compiles MDX at build time —
  confirmed on the production build: every locale of every case study still
  prerenders (`x-nextjs-prerender: 1`), and the strict CSP still ships with no
  `unsafe-eval`. `src/mdx-components.tsx` themes the compiled output to the
  desk (paragraphs get the existing `.lede` treatment; headings need no
  override, `h2` was already styled); new `.case-body` rules in `globals.css`
  cover lists, links, code and blockquotes for any study that wants them.
- `src/data/caseStudies.ts` is now a thin index over the content directory:
  `listCaseStudySlugs()` enumerates it (`generateStaticParams` no longer holds
  a hardcoded list) and `caseStudyBySlug()` reads a locale's frontmatter via
  `gray-matter` — no MDX compilation needed just to list or link a study.
  `work/[slug]/page.tsx` dynamically `import()`s the matching `.mdx` file for
  the body; `dynamicParams = false` keeps an unknown slug a real 404 rather
  than falling through to on-demand rendering.
- Adding a study is now "add a directory": six `.mdx` files, nothing else to
  wire up. `caseStudies.test.ts` fails if a locale's frontmatter drifts from
  English (project/stack/live/repo/order must match; only `description` and
  the body should differ) or if a locale's body is left identical to English.
  `scripts/check-privacy.mjs` now also scans `content/`.
- The three `problem`/`approach`/`result` `UiCopy` keys are gone — the page no
  longer needs them now that MDX supplies its own headings; caught by
  `copyUsage.test.ts` (added in v0.11.1) before it could ship as dead copy.
- `@next/mdx`, `@mdx-js/loader`, and the three remark plugins are
  devDependencies (build-time compiler tooling, never bundled); `@mdx-js/react`
  and `gray-matter` are production dependencies (imported by runtime app code).
  `remark-mdx-frontmatter` pulls in a `toml` package with an open, unfixed high
  severity advisory (prototype pollution / uncontrolled recursion) — it's a
  build-time-only transitive dependency exercised only for TOML frontmatter,
  which this repo never uses (YAML only), and `npm run audit` already scopes
  to `--omit=dev` for exactly this class of tooling dependency.
- Verified: `npm run ci` and `npm run test:e2e` green; `npx @lhci/cli autorun`
  budgets (performance/a11y/SEO/CLS/LCP/TBT) hold on both `/` and a case-study
  page; browser-checked frontmatter never leaks into the rendered body, and
  the Wordkeep Atlas embed still works.

## 0.11.1 — 2026-09-06

### Fixed

- The Wordkeep Atlas's `requestAnimationFrame` loop never stopped: its force
  sim doesn't settle (see 0.11.0), so the `moved <= 0.002` rest check the loop
  relied on almost never fired — the animation ran for as long as the case
  study page stayed open. `atlasSim.ts` gains `shouldAnimate` (+
  `IDLE_FRAME_BUDGET`, 260 ticks — the same budget `settle()` already uses for
  reduced motion): the idle entrance animation now stops after that budget
  regardless of `moved`; holding a drag always keeps it running. Unit-tested.
- `.github/workflows/production.yml` installed `vercel@41` for the manual
  production-deploy dispatch — four majors behind. Bumped to `vercel@59`.

### Removed

- Ten `UiCopy` keys nothing rendered: `aboutTitle`, `notFoundTitle`,
  `notFoundBody`, `errorTitle`, `errorBody`, `retryCta` (dead since v0.10.0
  made the error/404 boundaries static and English-only) and `role`
  (byte-identical duplicate of `headline`), `idea`, `expand`, `collapse`
  (leftovers from the fold accordion removed in v0.9.0). That's ten strings
  translated into six locales for nothing. New `copyUsage.test.ts` fails the
  suite if a `UiCopy` key stops being read anywhere in `app`/`components`/`lib`,
  so this doesn't silently reaccumulate — it's the guard the original Phase 3
  plan called for and never added.

### Docs

- `README.md`: list all three case studies (was just `iterm-studio`), and an
  Architecture section covering the server/client split, generated design
  tokens, and the extracted atlas simulation.

## 0.11.0 — 2026-09-06

### Atlas simulation extraction

- The Wordkeep Atlas's force layout moves out of `WordAtlas.tsx` into a pure
  `src/lib/atlasSim.ts`: `seedRing` (deterministic ring seed), `buildAdjacency`,
  `stepForces` (one physics tick, mutates in place), `settle` (run to a fixed
  tick count, used for the reduced-motion path), and `nodeAt` (pixel hit-test).
  No DOM, no canvas — unit-tested directly under the node project.
  `WordAtlas.tsx` keeps only canvas sizing, theme re-read, drawing, and pointer
  wiring, now calling into the extracted functions.
- While writing the extraction tests: the simulation's velocities don't
  actually settle — motion stays high and can grow for thousands of ticks
  (confirmed identical in the original code, so this predates the extraction,
  not a regression from it). Positions stay bounded regardless, because the
  per-tick clamp is unconditional, so the visible layout doesn't run away —
  but `loop()`'s `moved <= 0.002` rest check most likely never fires, so the
  animation frame loop runs for as long as the atlas is on screen rather than
  settling and going idle. Filed as a follow-up, not fixed here.
- Coverage: `atlasSim.ts` is 100% covered; global `functions` coverage rose
  71→73%, so `vitest.config.ts`'s `functions` threshold moves 70→73 (still
  short of the other three thresholds — the remaining gap is `WordAtlas.tsx`'s
  canvas/pointer closures, which need a real 2D context and are covered by the
  Playwright e2e suite instead).

## 0.10.0 — 2026-09-06

### Server / client boundary

- `Desk` is a Server Component again. It was one ~350-line `"use client"` blob
  that imported the whole six-locale `copy` map, so every visitor downloaded five
  locales they can't read plus the entire desk render tree. Now the desk renders
  on the server with only `copy[locale]`, and the interactive bits are small
  client islands:
  - `SpotlightLayer` — the `.desk` shell; wires the pointer-spotlight and takes
    the server-rendered content as `children`.
  - `LanguageSwitcher` reads `usePathname()` itself and takes `langLabel` as a
    prop; `ThemeSwitcher` takes `label` + `names`; `SignalBoard` takes a
    `strings` object; `TraceTheater` takes `strings`. None import `copy`.
- `app/[locale]/error.tsx` is English-only now, like `global-error.tsx` and
  `not-found.tsx` — an error boundary sits in every route's tree, so importing
  `copy` there shipped all of it site-wide.
- Result: no non-English locale copy in the client bundle on the main routes
  (checked by `clientBundle.test.ts`, which fails if a `"use client"` file
  imports the `copy` barrel). Raw client JS on `/` drops ~840 KB → ~645 KB.

### Scannable desk

- The home page is no longer an accordion. Every section — selected work,
  experience, stack, contact, signal, education — renders open and stacked, so a
  visitor scanning for twenty seconds sees the whole thing on one scroll instead
  of a column of collapsed headers. Sections are split by a hairline with real
  breathing room (`.sheet` / `.section`, on the new spacing scale).
- Selected work now leads, before the CV history.
- The one thing that still folds is **More** (lab ideas + extra repos) — a native
  `<details>`, collapsed by default, genuinely optional depth.
- Removed the fold machinery: `useFoldScroll` / `foldScroll` (a scroll listener +
  rAF + keyboard + a pin-quiet window that existed only to drive the accordion),
  the `Fold` component, and the `j` / `k` section-jump plus its footer hint copy.
  Nav links are plain in-page anchors with `scroll-margin-top`. ~14 tests for the
  deleted code went with it; new tests assert every section is present and only
  the archive collapses (`Desk.test.tsx`, `smoke.spec.ts`, `mobile.spec.ts`).

## 0.8.0 — 2026-09-06

### Design tokens

- **One source of truth for theme colour.** The `:root` / `[data-theme="…"]` custom-property blocks are now generated into `src/app/styles/tokens.css` from `THEME_PALETTES` in `src/lib/themePalettes.ts` (`tokensCssFile()` → `scripts/gen-tokens.mjs`, run at `prebuild` and as `npm run gen:tokens`). `globals.css` no longer declares a theme block, so the palette can't drift between the TS object and the stylesheet. `tokens.test.ts` fails the suite if the committed file is stale; `theme.test.ts` / `contrast.test.ts` now assert against the palette object directly.
- Hand-written scales gathered in `src/app/styles/scales.css`: the existing radius scale plus new spacing (`--s-1…--s-20`, 4px base), type (`--t-xs…--t-3xl`), line-height and z-index (`--z-skip`, `--z-tip`, `--z-heading`) ladders.
- **Cascade layers.** `globals.css` opens `@layer reset, tokens, base, components;` and wraps its rules accordingly, so a component rule can never lose to a reset selector on specificity and future utilities get a layer that always wins. The `@media print` and `prefers-reduced-motion` blocks are intentionally left unlayered so they still override everything.
- `package.json` is now `"type": "module"` (all scripts and configs were already ESM or explicitly `.cjs`).

### UI

- The language switcher's desktop row is now flag chips — a small inline-SVG flag per locale with its code on a dark plate over it (legible on any flag in either theme); the active locale gets a brass plate and outline. `en` is the Union Jack, `ca` the Catalan senyera. Spacing opened up from the old 2px. New `src/components/Flag.tsx`; the mobile `<select>` is unchanged.

## 0.7.0 — 2026-09-04

- **Wordkeep** joins featured work with a `/work/wordkeep` case study. The page embeds **The Atlas** — a frozen snapshot of Wordkeep's semantic graph (56 words, 90 links, four languages), drawn on a canvas with a tiny self-contained force layout, no graph library. Drag a word to move it, tap or click one to read its synonym / antonym / translation / related links in a small inline readout; the legend and colours come from the desk's own tokens. Two links out: the live 3D atlas and the Wordkeep app.
- Fix: the embed shipped hover-only, so it did nothing on a touchscreen — worse, `touch-action: pan-y` handed a finger-drag to page scroll before the canvas's own pointer handlers ever saw it. Click/tap now drives a persistent selection (works identically for mouse and touch) and nodes are properly draggable; `touch-action: none` lets the canvas claim its own gestures.
- `src/data/wordAtlas.ts` holds the snapshot and its localized micro-copy; `WordAtlas.tsx` is the client component. Unit tests for both, an axe check on the render, and e2e coverage (`e2e/atlasHit.ts`) driving a real mouse click and a real touchscreen tap through the actual selection.
- Dev-only: `next dev` serves an eval-tolerant CSP (`script-src … 'unsafe-eval'`) so React 19's development-mode stack reconstruction stops tripping the policy and logging a console error. The shipped production CSP is unchanged — still no `unsafe-eval` — and the swap is gated on `NODE_ENV` in `next.config.ts`. `CONTENT_SECURITY_POLICY_DEV` in `src/lib/securityHeaders.ts`, covered in `security.test.ts` / `headers.test.ts`.

## 0.6.0 — 2026-09-02

### Rendering

- The whole localized site is statically prerendered again. The root layout no longer reads a per-request value, so `/`, `/<locale>`, `/work/<slug>`, `/print` and `/lab/trace` ship as static HTML instead of rendering on every request. The `<html>`/`<body>` shell, fonts, JSON-LD and anti-flash script moved into `app/[locale]/layout.tsx`.
- Added a `global-error` boundary with its own shell for failures in the root layout itself.
- Single self-contained 404 surface (`app/not-found.tsx`) with its own shell; it is English-only so it can stay static.

### UI

- One shared corner-radius scale (`--r-xs` … `--r-lg`, plus the pill). The language `<select>`, the section headers, cards, the contact panel, tooltips and the trace textarea were square-cornered (or `border-radius: 0`); they now round consistently. Each fold reads as a soft rounded panel — collapsed, just its heading bar; open, a bordered tinted panel with the header flush to the top.

### SEO & polish

- `robots.txt` now `Disallow`s `/print` and `/lab` (bare and locale-prefixed), and those routes also send `X-Robots-Tag: noindex, nofollow` — honoured even when the HTML is never parsed.
- Every sitemap entry carries the full hreflang alternate set (incl. `x-default`), not just the `<head>`.
- Adaptive `theme-color` / `color-scheme` meta so mobile browser chrome tracks the light/dark palette instead of one hard-coded colour.
- `/api/health` reports `releasedAt` so the signal board can date the running build.

### Refactor

- `src/data/copy.ts` (1133 lines) split into `src/data/copy/<locale>.ts` — one file per locale — with a thin barrel assembling the maps. Verified byte-identical output. Locale-independent `skills` / `contact` moved to `copy/shared.ts`.
- The `/api/vitals` and `/api/errors` rate limiters are one shared `src/lib/rateLimit.ts`.
- Playwright now also runs a `mobile` (Pixel 7) project covering the compact header's language `<select>`.

### Fixes

- Sitemap `lastModified` is pinned to the release date instead of `new Date()`, so it no longer tells crawlers every URL changed on every fetch.
- Fold navigation (`j`/`k`/arrows) no longer fights the scroll listener: a short quiet window after a programmatic pin stops `openId` bouncing back.
- Pointer spotlight writes are coalesced to one per animation frame.
- Proof line emphasises every curated token, including the Italian "Barcellona" the old English-only check missed.

### Testing & CI

- Vitest now runs a `node` project for pure logic and a `jsdom` project for components and hooks. New behaviour tests replace the source-string assertions in `proxy` and `signalLayout`, and cover the previously untested `useFoldScroll`, `foldScroll`, `prefs`, `spotlight`, `github`, `sitemap`, `og`, `robots`, `next.config` headers, and every component (`Desk`, `SignalBoard`, `TraceTheater`, `Fold`, `Emphasize`, `ThemeSwitcher`, `LanguageSwitcher`, `PrintDesk`, error boundaries). 53 → 130+ tests.
- A translation-drift test fails if a non-English locale's prose fields are left as the English copy.
- `vitest-axe` fails the build on WCAG violations in the rendered desk.
- Coverage (v8) is collected and gated in `npm run ci`.
- Playwright smoke suite (`npm run test:e2e`) drives a local production build: home, locale switch, theme persistence, keyboard folds, print CV, `/api/health`, 404.
- Lighthouse CI runs against that local build instead of `https://marcfors.com/`, three runs, asserting performance / accessibility / SEO scores plus CLS, LCP and TBT — so a regression fails the PR, not the deploy.
- CI splits into `verify` and `e2e` jobs.

### Hardening

- Error observability, first-party only: `onRequestError` in `instrumentation.ts` logs structured server errors, and a `/api/errors` beacon (rate-limited, size-capped, validated) receives client-boundary reports from `error.tsx` and `global-error.tsx`. No third-party SDK, so the CSP stays intact.
- `github.ts` sends an optional `Authorization: Bearer $GITHUB_TOKEN` to lift the unauthenticated shared-IP rate limit, and logs when the repo fetch fails instead of silently returning an empty list.
- `@types/node` bumped to `^22` to match the Node version.

Deferred (follow-up): splitting `copy.ts` into per-locale files, `@layer`-ing `globals.css`, and a hash/nonce CSP. A nonce CSP needs per-request rendering, which would undo the static generation above; Next's own inline bootstrap scripts have build-varying hashes, so `script-src` keeps `'unsafe-inline'` for now.

## 0.5.0 — 2026-09-02

- System theme swatch follows the OS live; daylight/observatory stay explicit picks
- First visit redirects from `Accept-Language` (crawlers stay on English); language switcher writes the cookie so you can get back
- Compact mobile header: language select plus System/Dark/Light, extra palettes stay on wider screens
- Habit Breaker case study (live app only, no private repo)
- Hire line dates availability from Dec 2025; hero proof metric (~20% coverage)
- Per-locale Open Graph and Twitter images; JSON-LD `knowsAbout` / `seeks`
- Keyboard hint in the footer; Next.js 16 `proxy.ts` replaces `middleware.ts`

## 0.4.2 — 2026-09-02

- Revert the autocapitalize override from 0.4.1

## 0.4.0 — 2026-09-02

- Locale prefixes (`/es`, `/de`, …) with hreflang and sitemap entries
- Hire line under the role; sticky fold titles; j/k and arrow keys move folds
- iTerm Studio case study; print/PDF CV from the same copy
- Lab and extra repos tucked under More; Lighthouse CLS budget 0.1 in CI

## 0.3.0 — 2026-09-02

- Theme switcher: daylight paper, observatory, signal green, night blue, footlights. Follows `prefers-color-scheme` until you pick one.

## 0.2.2 — 2026-09-02

- Folds actually show their content (the 0fr grid row was collapsing open panels to zero height)

## 0.2.1 — 2026-09-02

- Sections fold: intro open by default, others collapsed; scrolling opens the current fold and closes the previous
- Recruiter highlights on years, stack, location, hire path, and key skills

## 0.2.0 — 2026-08-31

- Public source at `github.com/marcfs31/marcfors.com`, linked from the desk, selected work, and footer
- Hero title is Marc Fors; role stays the recruiter line under it
- Signal-lamp icon, web-vital hover plaques, six locales (EN/ES/CA/IT/PT/DE)
- Layout-shift fixes so CLS can stay in the good band (no full-desk re-render on pointer move, reserved hero, font fallback)
- Production GitHub workflows (CI, CodeQL, Vercel deploy), security.txt languages, 404/error, Trace Theater route

## 0.1.1 — 2026-08-31

- Selected work: iTerm Studio in (public repo + hosted gallery), SmartGarden out of the desk and the public-repo listing

## 0.1.0 — 2026-08-31

First public release of the observatory portfolio for [marcfors.com](https://marcfors.com).

- CV-accurate employment: career break from Dec 2025, Dynatrace through Nov 2025, then CREALOGIX and T-Systems
- Bilingual EN/ES desk, live GitHub public-repo list, source links only when the repo is public
- Recruiter and custom-app contact through `developer@marcfors.com`
- Security headers (HSTS, CSP, COOP), `security.txt`, first-party web vitals, `/api/health`, npm audit snapshot
- Vitest suite and GitHub Actions CI (privacy scan, test, typecheck, lint, audit, build)
