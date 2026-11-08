import {
  EMBEDDING_MODEL_ID,
  MAX_DISTANCE,
  TOP_K,
} from "./constants";
import { getSql } from "./db";
import { embedText, vectorLiteral } from "./embed";
import { escapeIlike, significantTokens } from "./lexical";
import type { ChunkRow } from "./types";

export async function lexicalFallback(question: string): Promise<ChunkRow[]> {
  const sql = getSql();
  const phrase = question.trim().replace(/[?!.]+$/g, "").trim();
  const tokens = significantTokens(question);

  if (phrase.length >= 8) {
    const pattern = `%${escapeIlike(phrase)}%`;
    const phraseRows = await sql`
      SELECT content, source_path, chunk_index
      FROM rag_chunks
      WHERE embedding_model = ${EMBEDDING_MODEL_ID}
        AND content ILIKE ${pattern} ESCAPE '\\'
      ORDER BY source_path, chunk_index
      LIMIT ${TOP_K}
    `;
    if (phraseRows.length > 0) {
      return phraseRows.map((row) => ({
        content: String(row.content),
        source_path: String(row.source_path),
        chunk_index: Number(row.chunk_index),
        distance: 0,
      }));
    }
  }

  if (tokens.length === 0) return [];
  const matched = new Map<string, ChunkRow>();
  for (const token of tokens) {
    const pattern = `%${escapeIlike(token)}%`;
    const rows = await sql`
      SELECT content, source_path, chunk_index
      FROM rag_chunks
      WHERE embedding_model = ${EMBEDDING_MODEL_ID}
        AND (
          content ILIKE ${pattern} ESCAPE '\\'
          OR source_path ILIKE ${pattern} ESCAPE '\\'
        )
      ORDER BY source_path, chunk_index
      LIMIT ${TOP_K}
    `;
    for (const row of rows) {
      const key = `${row.source_path}::${row.chunk_index}`;
      if (matched.has(key)) continue;
      matched.set(key, {
        content: String(row.content),
        source_path: String(row.source_path),
        chunk_index: Number(row.chunk_index),
        distance: 0,
      });
    }
  }

  return [...matched.values()].slice(0, TOP_K);
}

export async function retrieve(question: string): Promise<ChunkRow[]> {
  const sql = getSql();
  const embedding = await embedText(question);
  const vec = vectorLiteral(embedding);
  const rows = await sql`
    SELECT content, source_path, chunk_index,
      (embedding <=> ${vec}::vector) AS distance
    FROM rag_chunks
    WHERE embedding_model = ${EMBEDDING_MODEL_ID}
    ORDER BY embedding <=> ${vec}::vector
    LIMIT ${TOP_K}
  `;
  if (rows.length === 0) {
    throw new Error("no index rows; run npm run rag:seed");
  }
  const mapped = rows.map((row) => ({
    content: String(row.content),
    source_path: String(row.source_path),
    chunk_index: Number(row.chunk_index),
    distance: Number(row.distance),
  }));
  const hard = mapped.filter(
    (row) => Number.isFinite(row.distance) && row.distance <= MAX_DISTANCE,
  );
  if (hard.length > 0) return hard;
  return lexicalFallback(question);
}
