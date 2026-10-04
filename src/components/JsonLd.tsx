/**
 * Emits one `application/ld+json` block. Server-only: the payload is built
 * from constants and copy, never from request data, so `JSON.stringify` is
 * safe here. `</script>` cannot appear because no value is user-controlled.
 */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
