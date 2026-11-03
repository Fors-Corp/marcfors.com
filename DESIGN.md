---
name: marcfors.com
description: Semantic Atlas portfolio — night cartography with a living Wordkeep graph as the first viewport.
colors:
  ink: "#070b14"
  bg2: "#0a1020"
  paper: "#d9e2f2"
  paper-dim: "#9db0cc"
  muted: "#6e829e"
  chart: "#4d7cff"
  phosphor: "#7dffb3"
  danger: "#ff7a8a"
  light-ink: "#eef2f8"
  light-paper: "#0a1020"
  light-chart: "#2f5de0"
  light-phosphor: "#0a6b40"
typography:
  display:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "clamp(2.4rem, 6vw, 4.4rem)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Spectral, Georgia, serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.15
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "0.1em"
rounded:
  2xs: "4px"
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
  20: "80px"
components:
  button-primary:
    backgroundColor: "{colors.chart}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.chart}"
    rounded: "{rounded.sm}"
    padding: "12px 18px"
  nav-hire:
    backgroundColor: "transparent"
    textColor: "{colors.chart}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  hud-pill:
    backgroundColor: "transparent"
    textColor: "{colors.chart}"
    rounded: "{rounded.xs}"
    padding: "8px 12px"
---

## Overview

Public portfolio for Marc Fors in the **Semantic Atlas** world: night cartography, phosphor edges, force-graph nodes, and a legend HUD. Wordkeep’s living language graph owns the first viewport; Hire stays pinned in chrome. The retired signal-desk (ink/brass/paper grid) is an anti-reference — do not restore it.

Tokens live in `src/lib/themePalettes.ts` → generated `src/app/styles/tokens.css`. Scales in `src/app/styles/scales.css`. CSS custom properties remap legacy names (`--brass` = chart blue, `--signal` = phosphor).

## Colors

Dark default: ink `#070b14`, HUD panels `#0a1020`, paper `#d9e2f2`, chart `#4d7cff`, phosphor `#7dffb3`. Themes also ship light / green / blue / red palettes from the same roles. Prefer phosphor for live/status and chart for primary actions and edges. Avoid warm cream/brass fills — that is the old desk.

## Typography

**Spectral** for display and section titles; **Manrope** for body/UI (loaded into `--mono` for historical CSS hooks). Labels use tracked uppercase Manrope at ~11px. Hero display uses fluid clamp up to ~4.4rem. No Fraunces / IBM Plex Mono.

## Layout

Sticky HUD header; full-bleed atlas stage as first viewport; legend strip (Work / Signal / Proof / Hire) then stacked open sections (projects, work, skills, lab, contact, activity, signal, edu). Max content width `--container` 1100px. Usable at 320px; legend collapses to 2 columns under 720px. Below 720px the hero identity block stacks under the graph (not overlaid) so atlas labels stay readable.

## Elevation & Depth

Tonal panels (`--panel`) and 1px `--line` borders — not heavy card shadows. Pointer spotlight and atlas field washes add soft chart/phosphor glows. Primary CTA may use a conic border orbit when motion is allowed.

## Shapes

Soft radii from `--r-2xs` (4px) through `--r-lg` (18px); pills for nav chips. Atlas stage is square-edged full-bleed; embed atlas uses `--r-lg`.

## Components

- **BrandMark**: three linked nodes (constellation), phosphor + chart.
- **WordAtlas**: canvas force graph; hero variant and case-study embed.
- **nav-hire / hud-pill**: chrome actions; Hire never leaves the header.
- **cta / cta.ghost**: filled chart vs outline.
- **project-card**: panel + optional pointer spotlight wash.
- **SignalBoard**: vitals/audit proof strip under Signal.

## Do's and Don'ts

**Do**
- Lead with the interactive atlas; Wordkeep #1; App Store pending ribbon.
- Keep Hire one click from chrome; respect `prefers-reduced-motion` (settled graph, no rise/shine).
- Author copy and tests together; preserve locales, CSP, developer@marcfors.com, CV facts.

**Don't**
- Restore signal-desk brass/paper/observatory costume.
- Put a kicker/eyebrow above the hero heading.
- Add third-party trackers or Tailwind/shadcn utility classes.
- Let motion cause CLS or hide content before paint.
