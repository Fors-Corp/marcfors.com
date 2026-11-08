import {
  ASK_INSTRUCTIONS,
  CHAT_MODEL,
  EMBEDDING_MODEL_ID,
  REFUSAL,
} from "./constants";
import { retrieve } from "./retrieve";
import type { AskResult, ChunkRow, Citation } from "./types";

const CACHE_CONTROL = { type: "ephemeral" as const };

export function citationsForAnswer(answer: string, rows: ChunkRow[]): Citation[] {
  if (answer === REFUSAL) return [];
  const mentioned = rows.filter((row) => answer.includes(row.source_path));
  const chosen = mentioned.length > 0 ? mentioned : rows;
  return chosen.map((row) => ({
    source_path: row.source_path,
    chunk_index: row.chunk_index,
    distance: row.distance,
  }));
}

export async function askClaude(
  apiKey: string,
  question: string,
  context: string,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_tokens: 1024,
      cache_control: CACHE_CONTROL,
      system: [
        {
          type: "text",
          text: ASK_INSTRUCTIONS,
          cache_control: CACHE_CONTROL,
        },
        {
          type: "text",
          text: `Context:\n${context}`,
        },
      ],
      messages: [{ role: "user", content: question }],
    }),
  });

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `Anthropic HTTP ${response.status}`);
  }

  const text = (payload.content || [])
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text) {
    throw new Error("chat model returned no text");
  }
  return text;
}

export async function runAsk(question: string, apiKey: string): Promise<AskResult> {
  const rows = await retrieve(question);
  if (rows.length === 0) {
    return {
      answer: REFUSAL,
      citations: [],
      embedding_model: EMBEDDING_MODEL_ID,
      chat_model: CHAT_MODEL,
      run_id: null,
    };
  }
  const context = rows
    .map((row) => `[source_path: ${row.source_path}]\n${row.content}`)
    .join("\n\n");
  const answer = await askClaude(apiKey, question, context);
  return {
    answer,
    citations: citationsForAnswer(answer, rows),
    embedding_model: EMBEDDING_MODEL_ID,
    chat_model: CHAT_MODEL,
    run_id: null,
  };
}
