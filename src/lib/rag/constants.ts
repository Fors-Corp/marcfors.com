/** Shared Embedded RAG constants (forked from Fors-Corp/embedded-rag). */

export const REFUSAL = "The answer is not in the documents.";
export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_MODEL_ID = `local/${EMBEDDING_MODEL}`;
export const EMBEDDING_DIM = 384;
export const CHUNK_SIZE = 800;
export const CHUNK_OVERLAP = 120;

export const CHAT_MODEL = process.env.CHAT_MODEL || "claude-sonnet-5-5";
export const TOP_K = Number(process.env.TOP_K || 4);
export const MAX_DISTANCE = Number(process.env.MAX_DISTANCE || 0.65);
export const MAX_QUESTION_CHARS = Number(process.env.MAX_QUESTION_CHARS || 2000);

export const ASK_INSTRUCTIONS = `You answer questions using only the context below.
Cite the source path for each fact you use, exactly as written in the context.
The corpus is Marc Fors's portfolio (projects, case studies, about, skills, experience).
If the context states the fact, answer from it. Availability, location, and remote work are in the about and experience pages.
If the context does not contain the answer, reply with exactly this sentence and nothing else:
${REFUSAL}`;
