import { describe, expect, it } from "vitest";
import { parseUtf8JsonBytes, readUtf8Json } from "@/lib/utf8Json";

describe("parseUtf8JsonBytes", () => {
  it("round-trips accented Spanish through UTF-8 bytes", () => {
    const payload = {
      answer: "Sí, Marc está abierto. Página único público. ¿remoto?",
    };
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    expect(parseUtf8JsonBytes(bytes)).toEqual(payload);
  });

  it("does not interpret UTF-8 accent bytes as ISO-8859-2 digraphs", () => {
    // C3 A1 is UTF-8 "á". Misread as ISO-8859-2 that becomes "ĂĄ".
    const utf8Json = new TextEncoder().encode(JSON.stringify({ answer: "está" }));
    const parsed = parseUtf8JsonBytes(utf8Json) as { answer: string };
    expect(parsed.answer).toBe("está");
    expect(parsed.answer).not.toContain("Ă");
    expect([...parsed.answer].map((c) => c.codePointAt(0))).toEqual([
      0x65, 0x73, 0x74, 0xe1,
    ]);
  });
});

describe("readUtf8Json", () => {
  it("decodes via arrayBuffer as UTF-8, ignoring locale text decoding", async () => {
    const body = new TextEncoder().encode(
      JSON.stringify({ answer: "Sí, la página es pública." }),
    );
    const response = new Response(body, {
      headers: { "content-type": "application/json" },
    });
    await expect(readUtf8Json(response)).resolves.toEqual({
      answer: "Sí, la página es pública.",
    });
  });
});
