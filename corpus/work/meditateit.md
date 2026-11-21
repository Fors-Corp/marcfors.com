# MeditateIt

## Problem

Most meditation and sleep apps stream recorded audio behind an account, a subscription and analytics, and many lean on health claims they cannot back. I wanted a calm sound tool that works offline, keeps everything on the device, and says only what it is: a listening aid, not a treatment.

## Approach

The sound is generated live with the Web Audio API, so there are no audio files to download. An engine stacks four layer types: noise (white, pink, brown, with an AudioWorklet processor), named tones in Hz, binaural or isochronic beats, and nature textures (rain, forest, shore, wind). Each layer has its own EQ and fades, and switching presets crossfades over about two seconds instead of cutting. Presets are grouped by category, any of them can be cloned into a personal preset, and multi-stage sequences advance on their own, with the stage timer frozen while paused.

It is an installable PWA with an offline shell and self-hosted fonts. A new service worker is applied only after a quiet moment and never while audio is playing, so an update cannot interrupt a session. Preferences, presets, sequences and session history live in `localStorage`, with JSON backup and restore (merge or replace), a retention window and an erase-all control. The interface comes in five languages (English, Spanish, Catalan, French, Portuguese) and five themes plus a follow-system option.

The copy is checked by tests: the catalogs are refused if they contain treatment or diagnosis vocabulary, and band names are softened (a "~10 Hz glide" rather than a clinical label). The test suite is a set of plain `*.check.ts` scripts covering backup parsing, erase and retention, crossfade and EQ limits, and the CSP on the built HTML; a GitHub Pages workflow lints, tests and builds before every deploy.

## Result

A working app anyone can open and install, with no account and no data leaving the browser. The limits are stated rather than hidden: mobile browsers may suspend audio when the screen locks, so it is not a native player, and binaural beats need stereo headphones. The repository has no license file, so the source is public for viewing rather than for reuse.

## Links

Stack: Vite, React, TypeScript, Web Audio.
Live: https://marcfs31.github.io/MeditateIt/
Repo: https://github.com/marcfs31/MeditateIt
Public source.
Case study: /work/meditateit
