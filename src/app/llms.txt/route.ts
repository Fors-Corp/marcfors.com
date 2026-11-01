import { llmsTxt } from "@/lib/llms";

/** Answer engines fetch this by convention. A dot in the path skips the locale proxy. */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
