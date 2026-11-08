import { runAsk, databaseUrl, guardAskRequest, publicError, validateQuestion } from "@/lib/rag";
import { readJsonBody } from "@/lib/requestBody";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const blocked = guardAskRequest(request);
  if (blocked) return blocked;

  if (!databaseUrl()) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const read = await readJsonBody(request, 4096);
  if (!read.ok) {
    return Response.json({ error: read.error }, { status: read.status });
  }
  const body = read.value;
  const question =
    body && typeof body === "object" && "question" in body
      ? (body as { question: unknown }).question
      : undefined;
  const parsed = validateQuestion(question);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await runAsk(parsed.question, apiKey);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: publicError(error) }, { status: 500 });
  }
}
