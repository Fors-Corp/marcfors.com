import { fetchGitHubActivity } from "@/lib/githubActivity";

export async function GET() {
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
