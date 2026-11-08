import { afterEach, describe, expect, it } from "vitest";
import { publicError, requireAskSecret, validateQuestion } from "@/lib/rag/guard";

describe("rag guard", () => {
  afterEach(() => {
    delete process.env.RAG_ASK_SECRET;
  });

  it("rejects empty and oversized questions", () => {
    expect(validateQuestion("")).toEqual({ ok: false, error: "question is empty" });
    expect(validateQuestion("   ")).toEqual({ ok: false, error: "question is empty" });
    expect(validateQuestion(null)).toEqual({ ok: false, error: "question is empty" });
    const huge = "x".repeat(2001);
    expect(validateQuestion(huge).ok).toBe(false);
    expect(validateQuestion("What is Wordkeep?")).toEqual({
      ok: true,
      question: "What is Wordkeep?",
    });
  });

  it("requires the optional ask secret when configured", () => {
    process.env.RAG_ASK_SECRET = "s3cret";
    const unauthorized = requireAskSecret(new Request("http://localhost/api/ask"));
    expect(unauthorized).toBe("unauthorized");
    const okHeader = requireAskSecret(
      new Request("http://localhost/api/ask", {
        headers: { "x-rag-secret": "s3cret" },
      }),
    );
    expect(okHeader).toBeNull();
    const okBearer = requireAskSecret(
      new Request("http://localhost/api/ask", {
        headers: { authorization: "Bearer s3cret" },
      }),
    );
    expect(okBearer).toBeNull();
  });

  it("hides infrastructure details from public errors", () => {
    expect(publicError(new Error("Neon password auth failed"))).toBe("request failed");
    expect(publicError(new Error("onnx embedding crash"))).toBe("request failed");
    expect(publicError(new Error("question is empty"))).toBe("question is empty");
  });
});
