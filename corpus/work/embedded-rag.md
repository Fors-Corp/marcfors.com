# Embedded RAG


## Problem

Demo visitors evaluating Fors Corp work needed grounded answers from an indexed corpus without agent loops or tool-calling theatre — cite when the documents support it, refuse when they do not.

## Approach

Embedded RAG is classic retrieval-augmented generation: hybrid retrieve over pgvector — vector similarity and lexical match fused with Reciprocal Rank Fusion — then one Claude generation. Dual-stack Python and Vercel/Neon share chunking, paraphrase-multilingual MiniLM embeddings, a distance gate and the same refusal text. Multi-format ingest covers files (including images and SQLite), public URLs and Vercel Blob storage; the ask path returns citations or the fixed abstain: "The answer is not in the documents."

## Result

A live demo at embedded-rag.vercel.app where a visitor can try the pre-indexed demo corpus or add their own files and websites and get a cited answer — or an honest refusal — in seconds.

## Links

Stack: Python, React, TypeScript, Neon, Claude API.
Live: https://embedded-rag.vercel.app
Private source.
Case study: /work/embedded-rag
