import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

afterEach(() => vi.useRealTimers());

describe("createRateLimiter", () => {
  it("allows up to `max` hits per key, then blocks", () => {
    const limited = createRateLimiter({ max: 3 });
    expect(limited("a")).toBe(false);
    expect(limited("a")).toBe(false);
    expect(limited("a")).toBe(false);
    expect(limited("a")).toBe(true);
    // a different key has its own budget
    expect(limited("b")).toBe(false);
  });

  it("forgets hits once the window has passed", () => {
    vi.useFakeTimers();
    const limited = createRateLimiter({ max: 1, windowMs: 1_000 });
    expect(limited("k")).toBe(false);
    expect(limited("k")).toBe(true);
    vi.advanceTimersByTime(1_100);
    expect(limited("k")).toBe(false);
  });

  it("sweeps at the key cap without forgetting a still-active key", () => {
    vi.useFakeTimers();
    const limited = createRateLimiter({ max: 1, windowMs: 1_000, maxKeys: 3 });
    limited("old-1");
    limited("old-2");
    vi.advanceTimersByTime(1_100);
    limited("active");
    // At the cap: the sweep must forget the idle keys but still block "active".
    limited("new");
    expect(limited("active")).toBe(true);
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://x", { headers });

  it("prefers the first x-forwarded-for entry", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip, then a local sentinel", () => {
    expect(clientIp(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(clientIp(req({}))).toBe("local");
  });
});
