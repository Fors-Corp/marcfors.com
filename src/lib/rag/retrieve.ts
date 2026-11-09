import {
  EMBEDDING_MODEL_ID,
  MAX_DISTANCE,
  TOP_K,
} from "./constants";
import { getSql } from "./db";
import { embedText, vectorLiteral } from "./embed";
import {
  CV_SOURCE_PATH,
  contextCoversQuestion,
  escapeIlike,
  namedSourcePaths,
  prefersCvSource,
  rankLexicalHits,
  reciprocalRankFusion,
  significantTokens,
  type LexicalHit,
} from "./lexical";
import { preferCvChunks } from "./rank";
import type { ChunkRow } from "./types";

export { preferCvChunks } from "./rank";

function toChunkRow(row: Record<string, unknown>, distance = 0): ChunkRow {
  return {
    content: String(row.content),
    source_path: String(row.source_path),
    chunk_index: Number(row.chunk_index),
    distance: Number.isFinite(Number(row.distance)) ? Number(row.distance) : distance,
  };
}

export async function retrieveBySourcePaths(
  sourcePaths: string[],
): Promise<ChunkRow[]> {
  if (sourcePaths.length === 0) return [];
  const sql = getSql();
  const rows = await sql`
    SELECT content, source_path, chunk_index
    FROM rag_chunks
    WHERE embedding_model = ${EMBEDDING_MODEL_ID}
      AND source_path = ANY(${sourcePaths})
    ORDER BY source_path, chunk_index
    LIMIT ${Math.max(TOP_K, 6)}
  `;
  return rows.map((row) => toChunkRow(row, 0));
}

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
      return phraseRows.map((row) => toChunkRow(row, 0));
    }
  }

  if (tokens.length === 0) return [];
  const matched: LexicalHit[] = [];
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
      LIMIT ${TOP_K * 2}
    `;
    for (const row of rows) {
      matched.push({
        content: String(row.content),
        source_path: String(row.source_path),
        chunk_index: Number(row.chunk_index),
        tokenHits: 0,
      });
    }
  }

  return rankLexicalHits(matched, tokens, TOP_K).map((hit) => ({
    content: hit.content,
    source_path: hit.source_path,
    chunk_index: hit.chunk_index,
    distance: 0,
  }));
}

async function vectorCandidates(question: string, limit: number): Promise<ChunkRow[]> {
  const sql = getSql();
  const embedding = await embedText(question);
  const vec = vectorLiteral(embedding);
  const rows = await sql`
    SELECT content, source_path, chunk_index,
      (embedding <=> ${vec}::vector) AS distance
    FROM rag_chunks
    WHERE embedding_model = ${EMBEDDING_MODEL_ID}
    ORDER BY embedding <=> ${vec}::vector
    LIMIT ${limit}
  `;
  if (rows.length === 0) {
    throw new Error("no index rows; run npm run rag:seed");
  }
  return rows.map((row) => toChunkRow(row));
}

export async function retrieve(question: string): Promise<ChunkRow[]> {
  const named = namedSourcePaths(question);
  if (named.length > 0) {
    const byName = await retrieveBySourcePaths(named);
    if (byName.length > 0) return byName.slice(0, TOP_K);
  }

  if (prefersCvSource(question)) {
    const cvRows = await retrieveBySourcePaths([CV_SOURCE_PATH]);
    if (cvRows.length > 0) {
      // Still blend a little vector context so project asks that say "CV" get range.
      try {
        const vector = await vectorCandidates(question, TOP_K);
        const fused = reciprocalRankFusion(
          [
            cvRows.map((row, i) => ({
              key: `${row.source_path}::${row.chunk_index}`,
              row: { ...row, tokenHits: cvRows.length - i },
            })),
            vector.map((row) => ({
              key: `${row.source_path}::${row.chunk_index}`,
              row: { ...row, tokenHits: 0 },
            })),
          ],
          TOP_K,
        );
        return fused;
      } catch {
        return cvRows.slice(0, TOP_K);
      }
    }
  }

  const candidateK = Math.max(2 * TOP_K, 8);
  const mapped = await vectorCandidates(question, candidateK);
  const hard = preferCvChunks(
    mapped.filter(
      (row) => Number.isFinite(row.distance) && row.distance <= MAX_DISTANCE,
    ),
  ).slice(0, TOP_K);

  const covered = contextCoversQuestion(
    hard.map((row) => `${row.source_path}\n${row.content}`).join("\n"),
    question,
  );
  if (hard.length > 0 && covered) return hard;

  const lexical = await lexicalFallback(question);
  if (lexical.length === 0) return hard;

  // Hybrid RRF when vector passed distance but missed exact terms (or uncovered).
  const fused = reciprocalRankFusion(
    [
      mapped.map((row) => ({
        key: `${row.source_path}::${row.chunk_index}`,
        row: { ...row, tokenHits: 0 },
      })),
      lexical.map((row, index) => ({
        key: `${row.source_path}::${row.chunk_index}`,
        row: { ...row, tokenHits: lexical.length - index },
      })),
    ],
    TOP_K,
  );
  return fused.length > 0 ? fused : lexical;
}
