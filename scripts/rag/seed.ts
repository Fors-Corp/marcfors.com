/**
 * Seed portfolio corpus into Neon pgvector (forked from Fors-Corp/embedded-rag seed).
 *
 * Requires DATABASE_URL or POSTGRES_URL (Neon with pgvector).
 * Does not invent secrets — load them from .env.local / .env (mode 600).
 */
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { env, pipeline } from "@huggingface/transformers";

import { splitText } from "./chunk.js";

config({ path: ".env.local" });
config({ path: ".env" });

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_MODEL_ID =
  process.env.EMBEDDING_MODEL_ID || `local/${EMBEDDING_MODEL}`;
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM || 384);
const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 800);
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP || 120);

if (env.backends.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}
env.allowLocalModels = false;
env.cacheDir = process.env.TRANSFORMERS_CACHE || "/tmp/transformers-cache";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const corpusDir = path.join(root, "corpus");

function chunkId(sourcePath: string, index: number, digest: string): string {
  return createHash("sha256")
    .update(`${EMBEDDING_MODEL_ID}\n${sourcePath}\n${index}\n${digest}`)
    .digest("hex");
}

function vectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

async function listMarkdownFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(full, base)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (entry.name === "ATTRIBUTION") continue;
    if (!/\.(md|txt)$/i.test(entry.name)) continue;
    files.push(path.relative(base, full));
  }
  return files.sort();
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const corpusStat = await stat(corpusDir).catch(() => null);
  if (!corpusStat?.isDirectory()) {
    throw new Error(`corpus directory missing: ${corpusDir}`);
  }

  const relativePaths = await listMarkdownFiles(corpusDir);
  if (relativePaths.length === 0) {
    throw new Error("corpus/ has no .md/.txt files to seed");
  }

  console.log("loading embedding model…");
  const preferred = (process.env.EMBED_DEVICE || "cpu").toLowerCase();
  const device = ["cpu", "webgpu", "cuda"].includes(preferred)
    ? preferred
    : "cpu";
  const extractor = await pipeline("feature-extraction", EMBEDDING_MODEL, {
    device: device as "cpu" | "webgpu" | "cuda",
    dtype: "q8",
  });

  const sql = neon(url);
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await sql`
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id text PRIMARY KEY,
      content text NOT NULL,
      embedding vector(384) NOT NULL,
      source_path text NOT NULL,
      chunk_index integer NOT NULL,
      embedding_model text NOT NULL
    )
  `;
  // App connects as table owner — FORCE RLS so owner bypass cannot void policies.
  await sql`ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY`;
  await sql`ALTER TABLE rag_chunks FORCE ROW LEVEL SECURITY`;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'rag_chunks' AND policyname = 'rag_chunks_all'
      ) THEN
        CREATE POLICY rag_chunks_all ON rag_chunks
          FOR ALL
          USING (true)
          WITH CHECK (true);
      END IF;
    END
    $$
  `;
  await sql`DELETE FROM rag_chunks WHERE embedding_model = ${EMBEDDING_MODEL_ID}`;

  let count = 0;
  for (const relative of relativePaths) {
    const absolute = path.join(corpusDir, relative);
    const text = await readFile(absolute, "utf8");
    const sourcePath = relative.split(path.sep).join("/");
    const parts = splitText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    for (let index = 0; index < parts.length; index += 1) {
      const content = parts[index]!;
      const digest = createHash("sha256").update(content).digest("hex");
      const id = chunkId(sourcePath, index, digest);
      const output = await extractor(content, {
        pooling: "mean",
        normalize: true,
      });
      const embedding = Array.from(output.data as Float32Array);
      if (embedding.length !== EMBEDDING_DIM) {
        throw new Error(`bad embedding dim ${embedding.length}`);
      }
      await sql`
        INSERT INTO rag_chunks (id, content, embedding, source_path, chunk_index, embedding_model)
        VALUES (
          ${id},
          ${content},
          ${vectorLiteral(embedding)}::vector,
          ${sourcePath},
          ${index},
          ${EMBEDDING_MODEL_ID}
        )
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          source_path = EXCLUDED.source_path,
          chunk_index = EXCLUDED.chunk_index,
          embedding_model = EXCLUDED.embedding_model
      `;
      count += 1;
    }
  }
  console.log(
    `seeded ${count} chunks from ${relativePaths.length} files as ${EMBEDDING_MODEL_ID}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
