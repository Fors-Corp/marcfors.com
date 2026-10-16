import { TECHNOLOGY_BRANDS } from "@/lib/technologyIcons";

export const dynamic = "force-static";

export function GET() {
  const symbols = Object.values(TECHNOLOGY_BRANDS)
    .map((icon) => `<symbol id="${icon.slug}" viewBox="0 0 24 24"><path d="${icon.path}"/></symbol>`)
    .join("");
  return new Response(`<svg xmlns="http://www.w3.org/2000/svg"><defs>${symbols}</defs></svg>`, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
