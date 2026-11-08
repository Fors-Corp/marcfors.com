---
name: update-cv
description: Refresh GitHub contribution stats on the downloadable portfolio CV (docs/cv → public/marc-fors-cv.pdf). Use when contributions, PR counts, or the published CV look stale, or when asked to update the CV download on marcfors.com. Slash command: /update-cv.
---

# Update CV contributions

Facts that must not be restated here live in `AGENTS.md` (privacy, phone-off-git, CV as source of truth).

## What to run

```bash
npm run cv:update
npm run privacy
```

`cv:update` fetches live stats for `marcfs31`, patches the activity clause in
`docs/cv/Marc_Fors_CV_AI.docx`, rebuilds the PDF with LibreOffice, and copies it
to `public/marc-fors-cv.pdf`.

## Stats

- Trailing-year contribution total from `https://github.com/users/marcfs31/contributions`
- PRs created and merged in the last 30 days via GitHub Search (`author:marcfs31 type:pr …`)
- Unique repositories among those created PRs

Set `GITHUB_TOKEN` when Search API rate limits bite (CI already passes one).

## Do not

- Commit a phone number, Gmail address, or the retired `.me` host into `docs/cv/` or `public/`.
- Hand-edit `public/marc-fors-cv.pdf` without regenerating from the DOCX.
- Skip `npm run privacy` after a CV change.

## Automation

`.github/workflows/cv-contributions.yml` runs Mondays (and on `workflow_dispatch`)
and opens `chore/cv-contributions` when the clause changed.
