import { serializeJsonLd } from "@/lib/seo";

/** Emits one `application/ld+json` block; escaping lives in `serializeJsonLd`. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
