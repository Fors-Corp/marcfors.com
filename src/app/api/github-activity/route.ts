import { fetchGitHubActivity } from "@/lib/githubActivity";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const limited = createRateLimiter({ max: 60 });

export async function GET(request: Request) {
  if (limited(clientIp(request))) {
    return Response.json({ error: "rate limited" }, { status: 429 });
  }

  const snapshot = await fetchGitHubActivity();
  const unavailable = snapshot.events === null && snapshot.calendar === null;
  return Response.json(snapshot, {
    status: unavailable ? 503 : 200,
    headers: {
      "Cache-Control": snapshot.events === null || snapshot.calendar === null
        ? "no-store" : "public, max-age=0, s-maxage=300",
    },
  });
}
