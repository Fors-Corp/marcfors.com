import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

import { EMBEDDING_DIM, EMBEDDING_MODEL } from "./constants";

if (env.backends.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}
env.allowLocalModels = false;
// Vercel /var/task is read-only; cache model files under /tmp.
env.cacheDir = process.env.TRANSFORMERS_CACHE || "/tmp/transformers-cache";

let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (extractor) return extractor;
  // @huggingface/transformers ≥4 accepts cuda|webgpu|cpu — not wasm.
  const preferred = (process.env.EMBED_DEVICE || "cpu").toLowerCase();
  const allowed = new Set(["cpu", "webgpu", "cuda"]);
  const devices = allowed.has(preferred)
    ? [preferred, ...["cpu", "webgpu", "cuda"].filter((d) => d !== preferred)]
    : ["cpu"];
  let lastError: unknown;
  for (const device of devices) {
    try {
      extractor = await pipeline("feature-extraction", EMBEDDING_MODEL, {
        device: device as "cpu" | "webgpu" | "cuda",
        dtype: "q8",
      });
      return extractor;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("failed to load embedding model");
}

export async function embedText(text: string): Promise<number[]> {
  const model = await getExtractor();
  const output = await model(text, { pooling: "mean", normalize: true });
  const data = Array.from(output.data as Float32Array);
  if (data.length !== EMBEDDING_DIM) {
    throw new Error(`embedding dimension is ${data.length}, expected ${EMBEDDING_DIM}`);
  }
  return data;
}

export function vectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}
