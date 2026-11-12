/**
 * Decode a Response / byte buffer as UTF-8 JSON.
 *
 * Never use locale-default text decoding (ISO-8859-2 / Windows-125x on some
 * Central European hosts): UTF-8 bytes for Spanish accents then become
 * digraphs like "estĂĄ". JSON is always UTF-8 — decode it that way explicitly.
 */

export function parseUtf8JsonBytes(bytes: ArrayBuffer | Uint8Array): unknown {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const text = new TextDecoder("utf-8").decode(view);
  return JSON.parse(text) as unknown;
}

export async function readUtf8Json(response: Response): Promise<unknown> {
  return parseUtf8JsonBytes(await response.arrayBuffer());
}
