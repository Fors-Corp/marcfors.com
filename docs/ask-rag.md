# Portfolio Ask (RAG)

Ask answers portfolio questions from a Neon pgvector index, then Claude, with citations or a fixed abstain. There is no public ingest API.

## Corpus

| Source | `source_path` | Role |
| --- | --- | --- |
| `corpus/**/*.md` | relative path (`about.md`, `work/wordkeep.md`, …) | Curated site prose; case-study depth |
| Published CV | `cv/marc-fors-cv.pdf` | Authoritative for bio, roles, languages, availability |

One CV file only. Seed prefers `docs/cv/Marc_Fors_CV_AI.docx` (mammoth), else `public/marc-fors-cv.pdf` / `docs/cv/Marc_Fors_CV_AI.pdf` (`pdf-parse` + `@napi-rs/canvas`). Phone lines are stripped before embed. Do **not** use `scripts/lib/pdf.mjs` for Ask text (privacy scan only).

When CV facts conflict with thinner homepage markdown, Ask instructions and retrieve prefer the CV.

## Rebuild the index

Needs `DATABASE_URL` or `POSTGRES_URL` (portfolio Neon only — never the Embedded RAG demo DB) and the same embedding model id as production.

```bash
npm run rag:extract-cv   # smoke-print CV text + chunk count (no DB)
npm run rag:seed         # wipe model rows, reload corpus + CV
```

Chunking stays **800 / 120**. Embedding stays `local/Xenova/all-MiniLM-L6-v2` (384-d) unless you intentionally switch models and full re-seed.

## Retrieval

1. Named path (`marc-fors-cv.pdf` / `cv/…`) → fetch that source, skip distance gate.
2. CV / résumé wording → prefer `cv/marc-fors-cv.pdf`, fuse with vector via RRF.
3. Vector top candidates → `MAX_DISTANCE` → CV boost when distances are close.
4. If uncovered → accent-aware lexical ILIKE, then RRF hybrid with vector candidates.

## Chat model budget

Ask defaults to `claude-sonnet-5-5`. That model’s adaptive thinking counts toward `max_tokens`. Portfolio Ask sends `thinking: { type: "between_tools" }`, `output_config.effort: "low"`, and `ASK_MAX_TOKENS` (default 8192) so grounded answers finish; a `stop_reason: "max_tokens"` response is treated as an error rather than shown clipped above the citations rule.

## Ops notes

- After merging CV or corpus copy changes, run `npm run rag:seed` against production/preview Neon and redeploy if needed (seed is offline; the app only reads).
- Keep head branches after merge when GitHub auto-deletes them (project preference).
