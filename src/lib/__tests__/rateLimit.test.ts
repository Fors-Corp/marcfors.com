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
    expect(limited.trackedKeys()).toBe(3);
    // At the cap: the sweep forgets the two idle keys but still blocks "active".
    limited("new");
    expect(limited.trackedKeys()).toBe(2);
    expect(limited("active")).toBe(true);
  });

  it("sweeps at most once per window instead of on every request", () => {
    vi.useFakeTimers();
    const limited = createRateLimiter({ max: 5, windowMs: 1_000, maxKeys: 2 });
    limited("a");
    limited("b");
    vi.advanceTimersByTime(600);
    limited("c"); // at the cap: sweeps, nothing idle yet
    vi.advanceTimersByTime(500);
    limited("d"); // a and b are idle now, but the last sweep was 500ms ago
    expect(limited.trackedKeys()).toBe(4);
    vi.advanceTimersByTime(600);
    limited("e"); // a window after the last sweep: a, b and c are collected
    expect(limited.trackedKeys()).toBe(2);
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
