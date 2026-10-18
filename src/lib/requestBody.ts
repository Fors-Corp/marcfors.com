export type JsonBody = { ok: true; value: unknown } | { ok: false; status: 400 | 413 };

/**
 * Reads a JSON request body, refusing anything over `maxBytes`. Content-Length
 * is only a fast path: a chunked request omits it, so the cap is enforced on
 * the bytes actually streamed, before anything is buffered past the limit.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBody> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return { ok: false, status: 413 };
  if (!request.body) return { ok: false, status: 400 };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return { ok: false, status: 413 };
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();

  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}
