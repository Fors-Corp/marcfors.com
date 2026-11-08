# Embedded RAG


## Problem

Demo visitors evaluating Fors Corp work needed grounded answers from an indexed corpus without agent loops or tool-calling theatre — cite when the documents support it, refuse when they do not.

## Approach

Embedded RAG is classic retrieval-augmented generation: one pgvector search, then one Claude generation. Dual-stack Python and Vercel/Neon share chunking, MiniLM embeddings, a distance gate and the same refusal text. Multi-format ingest covers files and public URLs; the ask path returns citations or the fixed abstain: "The answer is not in the documents."

## Result

A live demo at embedded-rag.vercel.app where a visitor can try sample prompts or upload their own material and get a cited answer — or an honest refusal — in seconds. Public source under Fors-Corp.

## Links

Stack: Python, React, TypeScript, Neon, Claude API.
Live: https://embedded-rag.vercel.app
Repo: https://github.com/Fors-Corp/embedded-rag
Public source.
Case study: /work/embedded-rag
