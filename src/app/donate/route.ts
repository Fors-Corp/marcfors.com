import { NextResponse, type NextRequest } from "next/server";
import { supportLinkEnv, supportRedirectUrl } from "@/lib/support";

// Reads the env var and the query string per request; nothing here may be
// prerendered or cached, or every visitor would share one redirect.
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const linkEnv = supportLinkEnv(from);
  const target = supportRedirectUrl(process.env[linkEnv], from);
  if (!target) {
    // Fail visibly: a missing or malformed link is a deploy mistake, and a
    // redirect to anything else would send a tip to the wrong place.
    console.error(`[donate] ${linkEnv} is unset or not an https URL; refusing to redirect.`);
    return new Response("The support link is not configured.", {
      status: 500,
      headers: { ...NO_STORE, "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return NextResponse.redirect(target, { status: 302, headers: NO_STORE });
}
