import { describe, expect, it } from "vitest";
import { splitText } from "./chunk.js";

describe("splitText", () => {
  it("returns a single chunk for short text", () => {
    expect(splitText("Hello portfolio")).toEqual(["Hello portfolio"]);
  });

  it("splits long text with overlap", () => {
    const text = Array.from({ length: 40 }, (_, i) => `Paragraph ${i}. Extra detail here.`).join(
      "\n\n",
    );
    const parts = splitText(text, 120, 20);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => part.length <= 120 || part.includes(" "))).toBe(true);
  });
});
