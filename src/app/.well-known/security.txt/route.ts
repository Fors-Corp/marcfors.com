import { LOCALES } from "@/lib/locale";
import { DEV_EMAIL, SITE_URL } from "@/lib/site";

export function GET() {
  const body = [
    `Contact: mailto:${DEV_EMAIL}`,
    `Expires: 2027-08-31T00:00:00.000Z`,
    `Preferred-Languages: ${LOCALES.join(", ")}`,
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Hiring: ${SITE_URL}/#contact`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
