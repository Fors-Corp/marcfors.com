# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters and hiring managers scanning for an AI / LLM / frontend engineer in Barcelona or remote EU; secondary: clients commissioning a custom product or tool.

## Product Purpose

Public personal portfolio for Marc Fors at https://marcfors.com. Convince a recruiter in one scroll that this engineer ships complete products with LLM agents, React, TypeScript and Go — then make Hire / Commission / CV one click away.

## Positioning

A semantic atlas that watches itself: Wordkeep’s living language graph leads the first viewport; first-party web vitals, a supply-chain audit on every build, and a strict CSP prove the engineering bar. The atlas *is* the proof, not a brochure about proof.

## Operating Context

Next.js App Router on Vercel; locales in the URL; theme preference in localStorage; locale cookie only from the language switcher. CV PDF is the factual source of truth for employment dates and contact. Phone stays off the site.

## Capabilities and Constraints

- Locales: en, es, ca, de, fr, it, pt with hreflang.
- No cookie banner by design; adding a tracker requires a consent flow first.
- Public mailbox only: developer@marcfors.com.
- No Tailwind / shadcn; CSS custom properties; Spectral + Manrope (Semantic Atlas world).
- Semantic Atlas visual world is brief-pinned in AGENTS.md (night cartography, phosphor, chart blue).
- [inferred] No accordion on the home desk — every primary section is open and stacked.
- Featured product lead: Wordkeep (brand casing Wordkeep); App Store release pending.

## Brand Commitments

- Name: Marc Fors / SITE_NAME.
- Visual: Semantic Atlas — night cartography, phosphor edges, force-graph nodes, legend HUD (`#070b14` / `#d9e2f2` / `#7dffb3` / `#4d7cff` / `#0a1020`).
- Anti-reference: the retired signal-desk (ink, brass, paper grid) — do not restore it.
- Role line: AI software engineer (open to work).
- Product brand: Wordkeep (never “WordKeep” / “wordkeep” in UI copy).
- LinkedIn vanity: linkedin.com/in/marc-fors.
- GitHub user marcfs31 is public; private repos must not be linked unless explicitly opted in.

## Evidence on Hand

- `Marc_Fors_CV_AI_v2.pdf` / public CV path.
- Featured work and case studies in `src/data/projects.ts` and `content/work/`.
- Live npm audit snapshot and `/api/health`, `/api/vitals`.
- Do not fabricate customers, metrics, or employment claims beyond the CV and committed copy.

## Product Principles

1. Recruiter scan first: name, role, Hire pinned in chrome; Wordkeep atlas owns the first viewport.
2. The atlas demonstrates the engineering bar it claims (vitals, CSP, audit).
3. Privacy by default: first-party only, no trackers.
4. Motion and polish never cost CLS or hide content under reduced-motion.
5. Every copy / project / privacy change ships with a test.

## Accessibility & Inclusion

WCAG 2.2 AA target; axe in the unit suite; `prefers-reduced-motion` respected; visible focus; usable at 320px; skip link to main.
