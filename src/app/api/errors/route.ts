import { isErrorReport } from "@/lib/errors";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";
import { readJsonBody } from "@/lib/requestBody";

export const dynamic = "force-dynamic";

const limited = createRateLimiter({ max: 20 });

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  const read = await readJsonBody(request, 4096);
  if (!read.ok) {
    const error = read.status === 413 ? "payload too large" : "invalid json";
    return Response.json({ error }, { status: read.status });
  }
  const body = read.value;

  if (!isErrorReport(body)) {
    return Response.json({ error: "invalid report" }, { status: 400 });
  }

  console.error(
    JSON.stringify({
      type: "client-error",
      source: body.source,
      message: body.message,
      digest: body.digest ?? null,
      url: body.url ?? null,
    }),
  );

  return Response.json({ ok: true });
}
