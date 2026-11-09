import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rag/retrieve", () => ({
  retrieve: vi.fn(),
}));

import { LOCALES } from "@/lib/locale";
import { answerLanguageInstruction, askClaude, runAsk } from "@/lib/rag/ask";
import { ASK_INSTRUCTIONS, ASK_MAX_TOKENS, REFUSAL } from "@/lib/rag/constants";
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
          stop_reason: "end_turn",
        }),
      }),
    );
    const result = await runAsk("Where is Marc based?", "key", "es");
    expect(result.answer).toMatch(/Barcelona/);
    expect(result.citations[0]?.source_path).toBe("about.md");
    const body = JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body));
    expect(body.system[0].text).toBe(ASK_INSTRUCTIONS);
    expect(body.system[1].text).toBe(answerLanguageInstruction("es"));
    expect(body.system[1].text).toContain("Answer in Spanish");
    expect(body.system[1].text).toContain("English filenames");
    expect(body.system[1].text).toContain(REFUSAL);
    expect(body.system[2].text).toContain("[source_path: about.md]");
  });

  it("keeps the English abstain sentence when the page locale is not English", async () => {
    vi.mocked(retrieve).mockResolvedValue([]);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await runAsk("¿Cuál es la receta secreta?", "key", "es");
    expect(result.answer).toBe(REFUSAL);
    expect(result.citations).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
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

  it("passes the locale into the model instructions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "D'accord." }],
        stop_reason: "end_turn",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await askClaude("key", "Où est basé Marc ?", "ctx", "fr");
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.system[1].text).toBe(answerLanguageInstruction("fr"));
    expect(body.system[1].text).toContain("Answer in French");
    expect(body.messages[0].content).toBe("Où est basé Marc ?");

    await askClaude("key", "q", "ctx");
    const fallback = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
    expect(fallback.system[1].text).toBe(answerLanguageInstruction("en"));
  });

  it("reserves output budget and skips up-front thinking so answers are not cut mid-sentence", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: "Marc builds Wordkeep (projects.md)." }],
        stop_reason: "end_turn",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await askClaude("key", "What is Wordkeep?", "ctx");
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.max_tokens).toBe(ASK_MAX_TOKENS);
    expect(body.max_tokens).toBeGreaterThanOrEqual(4096);
    expect(body.thinking).toEqual({ type: "between_tools" });
    expect(body.output_config).toEqual({ effort: "low" });
  });

  it("refuses a max_tokens stop instead of returning a clipped answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ type: "text", text: "- Es un C" }],
          stop_reason: "max_tokens",
        }),
      }),
    );
    await expect(askClaude("key", "q", "ctx")).rejects.toThrow(
      /output limit before finishing/,
    );
  });

  it("names every shipped locale without copying the locale token into the prompt", () => {
    for (const locale of LOCALES) {
      const text = answerLanguageInstruction(locale);
      expect(text.startsWith("Answer in ")).toBe(true);
      expect(text).toContain("English filenames");
      expect(text).toContain(REFUSAL);
      expect(text).not.toContain(`locale=${locale}`);
    }
    expect(answerLanguageInstruction("de")).not.toBe(answerLanguageInstruction("en"));
    expect(answerLanguageInstruction()).toBe(answerLanguageInstruction("en"));
  });
});
