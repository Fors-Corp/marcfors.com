import { describe, expect, it } from "vitest";
import { readJsonBody } from "@/lib/requestBody";

// A chunked request carries no Content-Length, which is how a header-only cap
// was bypassed: build one from a stream so the header is genuinely absent.
function streamed(chunks: Uint8Array[]) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
  return new Request("http://localhost/api", { method: "POST", body, duplex: "half" } as RequestInit);
}

const chunked = (parts: string[]) => streamed(parts.map((part) => new TextEncoder().encode(part)));

describe("readJsonBody", () => {
  it("parses a body within the cap", async () => {
    expect(await readJsonBody(chunked(['{"a":', "1}"]), 64)).toEqual({ ok: true, value: { a: 1 } });
  });

  it("refuses a chunked body over the cap even with no Content-Length", async () => {
    const request = chunked(["[", "1,".repeat(600), "1]"]);
    expect(request.headers.get("content-length")).toBeNull();
    expect(await readJsonBody(request, 512)).toEqual({ ok: false, status: 413 });
  });

  it("refuses early on an oversized Content-Length", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Length": "9999" },
      body: "{}",
    });
    expect(await readJsonBody(request, 512)).toEqual({ ok: false, status: 413 });
  });

  it("reports malformed or missing bodies as 400", async () => {
    expect(await readJsonBody(chunked(["{nope"]), 64)).toEqual({ ok: false, status: 400 });
    expect(await readJsonBody(new Request("http://localhost/api", { method: "POST" }), 64)).toEqual({
      ok: false,
      status: 400,
    });
  });

  it("decodes a multi-byte character split across chunks", async () => {
    const bytes = new TextEncoder().encode('"ñ"');
    expect(await readJsonBody(streamed([bytes.slice(0, 2), bytes.slice(2)]), 64)).toEqual({ ok: true, value: "ñ" });
  });
});
