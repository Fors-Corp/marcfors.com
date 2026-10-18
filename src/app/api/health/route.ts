import { getAuditSnapshot } from "@/lib/audit";
import { SECURITY_HEADERS } from "@/lib/securityHeaders";
import { RELEASE_DATE, SITE_HOST, SITE_VERSION } from "@/lib/site";

export const dynamic = "force-dynamic";

export function GET() {
  const audit = getAuditSnapshot();
  return Response.json(
    {
      ok: true,
      service: SITE_HOST,
      version: SITE_VERSION,
      releasedAt: RELEASE_DATE,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "local",
      region: process.env.VERCEL_REGION ?? "local",
      encryption: {
        transport: "TLS 1.3 at the edge",
        hsts: true,
        cookies: "preference-only",
      },
      audit,
      headers: SECURITY_HEADERS.map((item) => item.key),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
