/**
 * Seed portfolio corpus + published CV into Neon pgvector
 * (forked from Fors-Corp/embedded-rag seed).
 *
 * Requires DATABASE_URL or POSTGRES_URL (Neon with pgvector).
 * Does not invent secrets — load them from .env.local / .env (mode 600).
 *
 * Indexes curated corpus/**\/*.md|.txt plus one CV at cv/marc-fors-cv.pdf.
 * Re-run after CV or corpus changes: npm run rag:seed
 */
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { env, pipeline } from "@huggingface/transformers";

import { splitText } from "./chunk.js";
import { collectSeedDocuments } from "./corpusDocs.js";

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

function chunkId(sourcePath: string, index: number, digest: string): string {
  return createHash("sha256")
    .update(`${EMBEDDING_MODEL_ID}\n${sourcePath}\n${index}\n${digest}`)
    .digest("hex");
}

function vectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const documents = await collectSeedDocuments(root);
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
  // Seed and /api/ask share DATABASE_URL, so the policy names current_user only.
  // There is no per-user predicate: the server reads the shared corpus.
  // Drop-and-create is one transaction, so a leftover PUBLIC policy cannot stay
  // OR-ed in beside the role policy (permissive policies are combined with OR).
  await sql`ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY`;
  await sql`ALTER TABLE rag_chunks FORCE ROW LEVEL SECURITY`;
  await sql`
    DO $$
    DECLARE
      ask_role text := current_user;
    BEGIN
      EXECUTE 'REVOKE ALL ON TABLE rag_chunks FROM PUBLIC';
      EXECUTE 'DROP POLICY IF EXISTS rag_chunks_all ON rag_chunks';
      EXECUTE format(
        'CREATE POLICY rag_chunks_all ON rag_chunks FOR ALL TO %I USING (true) WITH CHECK (true)',
        ask_role
      );
    END
    $$
  `;
  await sql`DELETE FROM rag_chunks WHERE embedding_model = ${EMBEDDING_MODEL_ID}`;

  let count = 0;
  for (const doc of documents) {
    const parts = splitText(doc.text, CHUNK_SIZE, CHUNK_OVERLAP);
    if (parts.length === 0) {
      throw new Error(`no extractable text for ${doc.sourcePath}`);
    }
    for (let index = 0; index < parts.length; index += 1) {
      const content = parts[index]!;
      const digest = createHash("sha256").update(content).digest("hex");
      const id = chunkId(doc.sourcePath, index, digest);
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
          ${doc.sourcePath},
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
    `seeded ${count} chunks from ${documents.length} files as ${EMBEDDING_MODEL_ID}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
