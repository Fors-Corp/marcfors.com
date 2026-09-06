# marcfors.com

Personal site for Marc Fors. Observatory desk. Locales: `/` English, `/es`, `/ca`, `/it`, `/pt`, `/de`. Print CV at `/print`. Case studies: `/work/wordkeep`, `/work/habit-breaker`, `/work/iterm-studio`.

Source: [github.com/marcfs31/marcfors.com](https://github.com/marcfs31/marcfors.com). Live: [marcfors.com](https://marcfors.com).

The CV is the source of truth for employment, education, skills and languages. GitHub supplies the live public-repo list. Public repositories get a source link; private work is listed without exposing the repo.

Recruiters and custom-app inquiries: [developer@marcfors.com](mailto:developer@marcfors.com).

## Run

```bash
npm install
npm run dev
```

```bash
npm test           # unit + component (Vitest: node + jsdom)
npm run test:e2e   # Playwright smoke against a local production build
npm run ci         # privacy + coverage + typecheck + lint + audit + build
```

## Architecture

- **Server tree + client islands.** [`src/components/Desk.tsx`](src/components/Desk.tsx) is a Server Component: it renders every locale's page from `copy[locale]` alone, never the whole six-locale map. The interactive bits are small, prop-driven `"use client"` islands (`SpotlightLayer`, `LanguageSwitcher`, `ThemeSwitcher`, `SignalBoard`, `TraceTheater`) that take the strings they need as props instead of importing `copy` themselves — [`clientBundle.test.ts`](src/lib/__tests__/clientBundle.test.ts) fails the build if one does. `error.tsx` / `global-error.tsx` / `not-found.tsx` are English-only and static for the same reason: an error boundary sits in every route's tree, so a `copy` import there would ship all six locales site-wide.
- **One source of truth for theme colour.** [`src/lib/themePalettes.ts`](src/lib/themePalettes.ts) (`THEME_PALETTES`) is the only place a theme's colours are written. `npm run gen:tokens` (also run at `prebuild`) generates [`src/app/styles/tokens.css`](src/app/styles/tokens.css) from it; [`tokens.test.ts`](src/lib/__tests__/tokens.test.ts) fails if the committed file drifts from what the generator would produce now. `globals.css` opens `@layer reset, tokens, base, components` so a component rule never loses to a reset selector on specificity.
- **The Wordkeep Atlas's physics live apart from its canvas.** [`src/lib/atlasSim.ts`](src/lib/atlasSim.ts) is a pure, unit-tested force simulation (seed, step, hit-test) — no DOM, no canvas. [`WordAtlas.tsx`](src/components/WordAtlas.tsx) only wires it to a `<canvas>`: sizing, theme re-read, pointer/drag events, drawing.
- **Copy stays live.** [`src/data/copy/<locale>.ts`](src/data/copy/en.ts) (one file per locale) holds every UI string; [`src/data/copy.ts`](src/data/copy.ts) assembles the `Record<Locale, …>` maps. [`copyUsage.test.ts`](src/lib/__tests__/copyUsage.test.ts) fails if a key stops being read anywhere in `app`/`components`/`lib` — the guard that would have caught the pre-v0.11.1 dead keys (`aboutTitle`, `role`, `expand`/`collapse` from the removed fold accordion, and the English-only error/404 strings) before they shipped.
- **Case-study prose is MDX, compiled at build time.** [`content/work/<slug>/<locale>.mdx`](content/work/wordkeep/en.mdx) — one self-contained file per locale, YAML frontmatter (`project`, `stack`, `live`, `repo`, `order`, `description`) plus a free-form prose body. [`src/data/caseStudies.ts`](src/data/caseStudies.ts) reads only the frontmatter (via `gray-matter`, no MDX compilation) for listing, metadata and the sitemap; [`work/[slug]/page.tsx`](src/app/[locale]/work/[slug]/page.tsx) dynamically `import()`s the matching `.mdx` file to render the body. `@next/mdx` (configured in `next.config.ts` with `remark-frontmatter` + `remark-mdx-frontmatter` + `remark-gfm`) compiles this at build time — the site stays fully static (`x-nextjs-prerender: 1`) and the production CSP never needs `unsafe-eval`. To add a study: create `content/work/<new-slug>/<locale>.mdx` for all six locales — `generateStaticParams` enumerates the directory, no other file to edit. `caseStudies.test.ts` fails if a locale's frontmatter drifts from English or its body is left untranslated.

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

TLS certificates are issued by Vercel after DNS answers correctly. No extra env vars are required for the site itself.

## Agents

Grok reads `AGENTS.md` and `.grok/rules/`. Project skills: `signal-desk`, `portfolio-locales`, `portfolio-launch`. `GROK.md` and `CLAUDE.md` point at the same contract.
