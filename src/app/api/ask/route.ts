import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/locale";
import { readJsonBody } from "@/lib/requestBody";
import {
  askJson,
  databaseUrl,
  guardAskRequest,
  maxAskBodyBytes,
  publicError,
  runAsk,
  validateQuestion,
} from "@/lib/rag";

function localeFromBody(body: unknown): Locale {
  if (!body || typeof body !== "object" || !("locale" in body)) return DEFAULT_LOCALE;
  const locale = (body as { locale: unknown }).locale;
  return isLocale(locale) ? locale : DEFAULT_LOCALE;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isJsonRequest(request: Request): boolean {
  const mime = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  return mime === "application/json";
}

export async function POST(request: Request) {
  try {
    const blocked = guardAskRequest(request);
    if (blocked) return blocked;

    if (!databaseUrl()) {
      return askJson({ error: "DATABASE_URL is not configured" }, 503);
    }

    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return askJson({ error: "ANTHROPIC_API_KEY is not configured" }, 503);
    }

    if (!isJsonRequest(request)) {
      return askJson({ error: "unsupported media type" }, 415);
    }

    const read = await readJsonBody(request, maxAskBodyBytes());
    if (!read.ok) {
      return askJson({ error: read.error }, read.status);
    }
    const body = read.value;
    const question =
      body && typeof body === "object" && "question" in body
        ? (body as { question: unknown }).question
        : undefined;
    const parsed = validateQuestion(question);
    if (!parsed.ok) {
      return askJson({ error: parsed.error }, 400);
    }

    const result = await runAsk(parsed.question, apiKey, localeFromBody(body));
    return askJson(result, 200);
  } catch (error) {
    // Do not log `error`: driver messages can include the question and the connection string.
    return askJson({ error: publicError(error) }, 500);
  }
}
