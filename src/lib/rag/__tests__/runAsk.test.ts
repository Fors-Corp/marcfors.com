import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rag/retrieve", () => ({
  retrieve: vi.fn(),
}));

import { REFUSAL } from "@/lib/rag/constants";
import { askClaude, runAsk } from "@/lib/rag/ask";
import { retrieve } from "@/lib/rag/retrieve";

describe("runAsk", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("abstains when retrieve returns no rows", async () => {
    vi.mocked(retrieve).mockResolvedValue([]);
    const result = await runAsk("Secret recipe?", "key");
    expect(result.answer).toBe(REFUSAL);
    expect(result.citations).toEqual([]);
  });

  it("asks Claude with retrieved context", async () => {
    vi.mocked(retrieve).mockResolvedValue([
      {
        content: "Marc lives in Barcelona.",
        source_path: "about.md",
        chunk_index: 0,
        distance: 0.2,
      },
    ]);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: "text", text: "Marc is based in Barcelona (about.md)." }],
        }),
      }),
    );
    const result = await runAsk("Where is Marc based?", "key");
    expect(result.answer).toMatch(/Barcelona/);
    expect(result.citations[0]?.source_path).toBe("about.md");
    expect(fetch).toHaveBeenCalled();
  });
});

describe("askClaude", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("surfaces Anthropic HTTP failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "boom" } }),
      }),
    );
    await expect(askClaude("key", "q", "ctx")).rejects.toThrow(/boom/);
  });
});
