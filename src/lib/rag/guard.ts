import { clientIp, createRateLimiter } from "@/lib/rateLimit";

import { MAX_QUESTION_CHARS } from "./constants";

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 30);

const limited = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
});

export function requireAskSecret(request: Request): string | null {
  const expected = process.env.RAG_ASK_SECRET?.trim();
  if (!expected) return null;
  const provided =
    request.headers.get("x-rag-secret")?.trim() ||
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")!.slice("Bearer ".length).trim()
      : "");
  if (provided !== expected) {
    return "unauthorized";
  }
  return null;
}

export function checkAskRateLimit(request: Request): string | null {
  if (limited(clientIp(request))) {
    return "rate limit exceeded";
  }
  return null;
}

export function validateQuestion(
  raw: unknown,
): { ok: true; question: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "question is empty" };
  }
  const question = raw.trim();
  if (!question) {
    return { ok: false, error: "question is empty" };
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return {
      ok: false,
      error: `question exceeds ${MAX_QUESTION_CHARS} characters`,
    };
  }
  return { ok: true, question };
}

export function publicError(error: unknown): string {
  if (!(error instanceof Error)) return "request failed";
  const message = error.message || "request failed";
  if (
    /anthropic|postgres|neon|onnx|embedding|ECONN|ETIMEDOUT|password|api[_-]?key/i.test(
      message,
    )
  ) {
    return "request failed";
  }
  if (message.length > 160) return "request failed";
  return message;
}

export function guardAskRequest(request: Request): Response | null {
  const authError = requireAskSecret(request);
  if (authError) {
    return Response.json({ error: authError }, { status: 401 });
  }
  const rateError = checkAskRateLimit(request);
  if (rateError) {
    return Response.json({ error: rateError }, { status: 429 });
  }
  return null;
}
