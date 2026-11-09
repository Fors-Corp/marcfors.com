import type { MetadataRoute } from "next";
import { AI_CRAWLERS } from "@/lib/aiCrawlers";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Noindex pages must remain crawlable so bots can see their robots metadata.
      { userAgent: "*", allow: "/" },
      // Answer engines and AI crawlers: explicitly welcome (see aiCrawlers.ts).
      { userAgent: [...AI_CRAWLERS], allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    // Yandex preferred-mirror directive. Google ignores `Host`.
    host: SITE_URL,
  };
}
