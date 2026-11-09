import { llmsFullTxt } from "@/lib/llms";

/** Long-form companion to `/llms.txt`. A dot in the path skips the locale proxy. */
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsFullTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
