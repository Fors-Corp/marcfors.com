export type JsonBody =
  | { ok: true; value: unknown }
  | { ok: false; status: 400; error: "invalid json" }
  | { ok: false; status: 413; error: "payload too large" };

const INVALID = { ok: false, status: 400, error: "invalid json" } as const;
const TOO_LARGE = { ok: false, status: 413, error: "payload too large" } as const;

/**
 * Reads a JSON request body, refusing anything over `maxBytes`. Content-Length
 * is only a fast path: a chunked request omits it, so the cap is enforced on
 * the bytes actually streamed, before anything is buffered past the limit.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBody> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return TOO_LARGE;
  if (!request.body) return INVALID;

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return TOO_LARGE;
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return { ok: true, value: JSON.parse(text) };
  } catch {
    // A body that aborts mid-stream is as unusable as malformed JSON.
    return INVALID;
  }
}
