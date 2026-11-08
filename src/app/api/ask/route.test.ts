import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rag", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rag")>("@/lib/rag");
  return {
    ...actual,
    databaseUrl: vi.fn(() => null),
    runAsk: vi.fn(),
  };
});

import { POST } from "@/app/api/ask/route";
import { databaseUrl, runAsk } from "@/lib/rag";

describe("POST /api/ask", () => {
  afterEach(() => {
    vi.mocked(databaseUrl).mockReturnValue(null);
    delete process.env.ANTHROPIC_API_KEY;
    vi.clearAllMocks();
  });

  it("returns 503 when the database is not configured", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "What is Wordkeep?" }),
      }),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "DATABASE_URL is not configured",
    });
  });

  it("returns 503 when Anthropic is not configured", async () => {
    vi.mocked(databaseUrl).mockReturnValue("postgresql://example");
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "What is Wordkeep?" }),
      }),
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "ANTHROPIC_API_KEY is not configured",
    });
  });

  it("returns 400 for an empty question", async () => {
    vi.mocked(databaseUrl).mockReturnValue("postgresql://example");
    process.env.ANTHROPIC_API_KEY = "test-key";
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "   " }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns the ask payload when configured", async () => {
    vi.mocked(databaseUrl).mockReturnValue("postgresql://example");
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(runAsk).mockResolvedValue({
      answer: "Wordkeep is a language app.",
      citations: [{ source_path: "projects.md", chunk_index: 0, distance: 0.1 }],
      embedding_model: "local/Xenova/all-MiniLM-L6-v2",
      chat_model: "claude-sonnet-5-5",
      run_id: null,
    });
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "What is Wordkeep?" }),
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.answer).toMatch(/Wordkeep/);
    expect(body.citations[0].source_path).toBe("projects.md");
    expect(runAsk).toHaveBeenCalledWith("What is Wordkeep?", "test-key", "en");
  });

  it("forwards a shipped locale and ignores an unknown one", async () => {
    vi.mocked(databaseUrl).mockReturnValue("postgresql://example");
    process.env.ANTHROPIC_API_KEY = "test-key";
    vi.mocked(runAsk).mockResolvedValue({
      answer: "Marc vive en Barcelona.",
      citations: [],
      embedding_model: "local/Xenova/all-MiniLM-L6-v2",
      chat_model: "claude-sonnet-5-5",
      run_id: null,
    });
    const post = (body: unknown) =>
      POST(
        new Request("http://localhost/api/ask", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      );

    expect((await post({ question: "¿Dónde vive Marc?", locale: "es" })).status).toBe(200);
    expect(runAsk).toHaveBeenLastCalledWith("¿Dónde vive Marc?", "test-key", "es");

    expect((await post({ question: "¿Dónde vive Marc?", locale: "zz" })).status).toBe(200);
    expect(runAsk).toHaveBeenLastCalledWith("¿Dónde vive Marc?", "test-key", "en");

    expect((await post({ question: "¿Dónde vive Marc?", locale: 4 })).status).toBe(200);
    expect(runAsk).toHaveBeenLastCalledWith("¿Dónde vive Marc?", "test-key", "en");
  });
});
