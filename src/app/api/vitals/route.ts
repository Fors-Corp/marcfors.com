import { clientIp, createRateLimiter } from "@/lib/rateLimit";
import { readJsonBody } from "@/lib/requestBody";
import { isVitalPayload } from "@/lib/vitals";

export const dynamic = "force-dynamic";

const limited = createRateLimiter({ max: 40 });

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  const read = await readJsonBody(request, 2048);
  if (!read.ok) {
    const error = read.status === 413 ? "payload too large" : "invalid json";
    return Response.json({ error }, { status: read.status });
  }
  const body = read.value;

  if (!isVitalPayload(body)) {
    return Response.json({ error: "invalid vital" }, { status: 400 });
  }

  console.info(
    JSON.stringify({
      type: "web-vital",
      name: body.name,
      value: Math.round(body.value * 1000) / 1000,
      rating: body.rating ?? null,
      id: body.id,
    }),
  );

  return Response.json({ ok: true });
}
