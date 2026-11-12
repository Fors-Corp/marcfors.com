import { createHash, timingSafeEqual } from "node:crypto";

import { createRateLimiter } from "@/lib/rateLimit";

import { MAX_QUESTION_CHARS } from "./constants";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX = 30;
const MIN_WINDOW_MS = 1_000;
const MAX_MAX = 120;
const DEFAULT_QUESTION_CHARS = 2_000;
const HARD_QUESTION_CHARS = 4_000;
const ASK_BODY_BYTES_CAP = 16_384;
const SHARED_RATE_BUCKET = "shared";

const ASK_RESPONSE_HEADERS = {
  "cache-control": "private, no-store",
  // Response.json() defaults to application/json without charset; spell UTF-8
  // so clients never guess Latin-1/Windows-125x for accented answers.
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
} as const;

// Allowlist, not a keyword denylist: driver errors omit words like "password"
// and can still echo the question or the connection string.
const SAFE_PUBLIC_ERROR =
  /^(?:question is empty|question exceeds [1-9]\d{0,6} characters|unauthorized|rate limit exceeded|invalid json|payload too large|unsupported media type)$/;

type Limiter = ReturnType<typeof createRateLimiter>;

let limiter: Limiter | null = null;
let limiterKey = "";

export function resetAskRateLimitForTests(): void {
  limiter = null;
  limiterKey = "";
}

function parsePositiveInt(raw: string | undefined, fallback: number): number | null {
  if (raw === undefined || raw.trim() === "") return fallback;
  const text = raw.trim();
  if (!/^[0-9]+$/.test(text)) return null;
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < 1) return null;
  return value;
}

function rateLimitConfig(): { windowMs: number; max: number } | null {
  const windowMs = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);
  const max = parsePositiveInt(process.env.RATE_LIMIT_MAX, DEFAULT_MAX);
  // `rows.length >= NaN` is never true, and a sub-millisecond window drops every
  // hit before the next request. A huge max is the same as no cap. Refuse a
  // broken window; clamp only the count so a typo cannot open the gate.
  // A longer window is stricter, so it is left as configured.
  if (windowMs === null || max === null || windowMs < MIN_WINDOW_MS) return null;
  return { windowMs, max: Math.min(max, MAX_MAX) };
}

function limiterFor(config: { windowMs: number; max: number }): Limiter {
  const key = `${config.windowMs}:${config.max}`;
  if (!limiter || limiterKey !== key) {
    limiter = createRateLimiter({ windowMs: config.windowMs, max: config.max });
    limiterKey = key;
  }
  return limiter;
}

function firstHop(header: string | null): string | null {
  if (!header) return null;
  const hop = header.split(",")[0]?.trim() ?? "";
  if (!hop || hop.length > 64) return null;
  if (!/^[0-9a-fA-F:.]+$/.test(hop)) return null;
  return hop.toLowerCase();
}

// Do not key the limit on x-forwarded-for: off Vercel the left-most hop is
// client-controlled, so rotating it bypassed the cap. x-vercel-forwarded-for
// is the platform value. With no trusted header, every caller shares one bucket.
function askRateLimitKey(request: Request): string {
  const vercel = firstHop(request.headers.get("x-vercel-forwarded-for"));
  if (vercel) return vercel;
  const real = firstHop(request.headers.get("x-real-ip"));
  if (real) return real;
  return SHARED_RATE_BUCKET;
}

function secretsEqual(provided: string, expected: string): boolean {
  const left = createHash("sha256").update(provided, "utf8").digest();
  const right = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(left, right);
}

function presentedSecret(request: Request): string {
  const header = request.headers.get("x-rag-secret")?.trim() ?? "";
  if (header) return header;
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const bearer = /^Bearer (\S+)$/i.exec(authorization);
  return bearer?.[1] ?? "";
}

export function requireAskSecret(request: Request): string | null {
  // Unset means the public widget may call. A present-but-blank value is a
  // broken lock, not an open one: treat it as configured and refuse.
  if (!("RAG_ASK_SECRET" in process.env)) return null;
  const expected = process.env.RAG_ASK_SECRET?.trim() ?? "";
  if (!expected) return "unauthorized";
  const provided = presentedSecret(request);
  if (!provided || !secretsEqual(provided, expected)) return "unauthorized";
  return null;
}

export function checkAskRateLimit(request: Request): string | null {
  const config = rateLimitConfig();
  if (!config) return "rate limit exceeded";
  if (limiterFor(config)(askRateLimitKey(request))) return "rate limit exceeded";
  return null;
}

export function questionCharLimit(raw: number = MAX_QUESTION_CHARS): number {
  if (!Number.isFinite(raw) || raw < 1) return DEFAULT_QUESTION_CHARS;
  return Math.min(Math.floor(raw), HARD_QUESTION_CHARS);
}

export function maxAskBodyBytes(chars: number = questionCharLimit()): number {
  // UTF-8 is at most 4 bytes per JS char, and JSON escaping can double that.
  const budget = chars * 8 + 256;
  if (!Number.isFinite(budget) || budget < 1) return 1024;
  return Math.min(ASK_BODY_BYTES_CAP, budget);
}

export function validateQuestion(
  raw: unknown,
): { ok: true; question: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "question is empty" };
  }
  const question = raw.replace(/\0/g, "").trim();
  if (!question) {
    return { ok: false, error: "question is empty" };
  }
  const limit = questionCharLimit();
  if (question.length > limit) {
    return {
      ok: false,
      error: `question exceeds ${limit} characters`,
    };
  }
  return { ok: true, question };
}

export function publicError(error: unknown): string {
  if (!(error instanceof Error)) return "request failed";
  if (SAFE_PUBLIC_ERROR.test(error.message)) return error.message;
  return "request failed";
}

export function askJson(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: ASK_RESPONSE_HEADERS });
}

export function guardAskRequest(request: Request): Response | null {
  // Count the attempt before checking the secret so a wrong header cannot
  // brute-force RAG_ASK_SECRET without hitting the cap.
  const rateError = checkAskRateLimit(request);
  if (rateError) {
    return askJson({ error: rateError }, 429);
  }
  const authError = requireAskSecret(request);
  if (authError) {
    return askJson({ error: authError }, 401);
  }
  return null;
}
