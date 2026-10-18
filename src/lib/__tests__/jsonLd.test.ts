import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/seo";

const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

describe("serializeJsonLd", () => {
  it("cannot close its <script> block early, whatever the frontmatter says", () => {
    const out = serializeJsonLd({ description: "a</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(out).not.toMatch(/<\/script/i);
  });

  it("round-trips to the same data with no raw line or paragraph separators", () => {
    const data = { note: `a < b ${LINE_SEPARATOR} c ${PARAGRAPH_SEPARATOR}`, nested: { list: ["</x>"] } };
    const out = serializeJsonLd(data);
    expect(JSON.parse(out)).toEqual(data);
    expect(out).not.toContain(LINE_SEPARATOR);
    expect(out).not.toContain(PARAGRAPH_SEPARATOR);
  });
});
