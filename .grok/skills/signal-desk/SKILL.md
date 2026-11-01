---
name: signal-desk
description: Observatory desk visual language for marcfors.com. Use when changing UI, CSS, the hero, SignalBoard, web vitals, CLS/LCP, the Live badge, BrandMark, or recruiter-facing title. Slash command: /signal-desk.
---

# Signal desk

Palette tokens live in `src/lib/themePalettes.ts` and are applied as `[data-theme]` in `src/app/globals.css` (`--ink`, `--brass`, `--paper`, `--signal`). Switcher is `ThemeSwitcher`. No Tailwind, no shadcn.

## Live signal stays green

Displayed Core Web Vitals must rate `good`. Ceilings are `VITAL_GOOD` in `src/lib/vitals.ts`. Do not fake a green rating.

CLS especially: never insert unreserved height, never re-render the whole desk on pointer move (spotlight uses `--spot-x` / `--spot-y`), keep `h1` as the single-line name, keep vital tooltips `position: absolute`. The desk is one scannable column — every `<section>` open and stacked (`.sheet` / `.section`); there is no More/archive fold. Scroll progress uses `--desk-progress` on the signal rail. Recruiter hits use `.hit` / `copy.hits`. `src/lib/__tests__/signalLayout.test.ts` guards the layout contract.

## Recruiter scan

`h1` is `SITE_NAME` ("Marc Fors"). The role stays in `.role` via `copy[locale].headline` ("Frontend software engineer") plus the green "open to work" kicker and Hire CTA. Do not bury the role.

## Icon

`src/app/icon.svg` and `BrandMark` are the same mark: ink tile, brass ring, signal pip. Change both together.
