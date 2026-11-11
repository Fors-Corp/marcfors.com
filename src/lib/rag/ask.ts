import { DEFAULT_LOCALE, type Locale } from "@/lib/locale";
import {
  ASK_INSTRUCTIONS,
  ASK_MAX_TOKENS,
  CHAT_MODEL,
  EMBEDDING_MODEL_ID,
  REFUSAL,
} from "./constants";
import { repairUtf8Mojibake } from "./mojibake";
import { retrieve } from "./retrieve";
import type { AskResult, ChunkRow, Citation } from "./types";

const CACHE_CONTROL = { type: "ephemeral" as const };

/** Sonnet 5.5 defaults to adaptive thinking at high effort; thinking tokens share
 *  max_tokens with the visible answer. Portfolio Ask is latency-sensitive RAG
 *  chat — skip up-front thinking and keep effort low so replies finish. */
const ASK_THINKING = { type: "between_tools" as const };
const ASK_OUTPUT_CONFIG = { effort: "low" as const };

/** Fixed names only. A request locale is never interpolated into the prompt. */
const ANSWER_LANGUAGE: Record<Locale, string> = {
  en: "English",
  es: "Spanish (informal tú)",
  ca: "Catalan (informal tu)",
  it: "Italian (informal tu)",
  pt: "European Portuguese (informal tu)",
  de: "German (informal du)",
  fr: "French (formal vous)",
};

export function answerLanguageInstruction(locale: Locale = DEFAULT_LOCALE): string {
  const language = ANSWER_LANGUAGE[locale];
  return `Answer in ${language}. Cite each corpus source path exactly as written in the context (English filenames). If the context does not support an answer, reply with exactly this English sentence and nothing else:\n${REFUSAL}`;
}

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
  locale: Locale = DEFAULT_LOCALE,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_tokens: ASK_MAX_TOKENS,
      thinking: ASK_THINKING,
      output_config: ASK_OUTPUT_CONFIG,
      cache_control: CACHE_CONTROL,
      system: [
        {
          type: "text",
          text: ASK_INSTRUCTIONS,
          cache_control: CACHE_CONTROL,
        },
        {
          type: "text",
          text: answerLanguageInstruction(locale),
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
    stop_reason?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `Anthropic HTTP ${response.status}`);
  }

  // max_tokens stop leaves a mid-sentence answer that still gets citations —
  // refuse rather than render a clipped reply under the citations rule.
  if (payload.stop_reason === "max_tokens") {
    throw new Error("chat model hit the output limit before finishing");
  }

  const text = (payload.content || [])
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("")
    .trim();

  if (!text) {
    throw new Error("chat model returned no text");
  }
  // Chat answers sometimes arrive with UTF-8 bytes already misread as
  // Windows-1250/1252 ("SĂ\xad" / "estĂˇ"). Repair before the JSON response.
  return repairUtf8Mojibake(text);
}

export async function runAsk(
  question: string,
  apiKey: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<AskResult> {
  const rows = await retrieve(question);
  // citationsForAnswer treats only the exact English REFUSAL as abstain.
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
  const answer = await askClaude(apiKey, question, context, locale);
  return {
    answer,
    citations: citationsForAnswer(answer, rows),
    embedding_model: EMBEDDING_MODEL_ID,
    chat_model: CHAT_MODEL,
    run_id: null,
  };
}
