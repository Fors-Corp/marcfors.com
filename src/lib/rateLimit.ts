/**
 * Best-effort in-memory sliding-window limiter. State lives on the serverless
 * instance, so it resets on a cold start and is not shared across regions — fine
 * for the low-stakes beacon endpoints it guards, not a security control.
 */
export function createRateLimiter({
  windowMs = 60_000,
  max,
  maxKeys = 10_000,
}: {
  windowMs?: number;
  max: number;
  maxKeys?: number;
}) {
  const hits = new Map<string, number[]>();
  let lastSweep = 0;
  function limited(key: string): boolean {
    const now = Date.now();
    // A key is otherwise only pruned when it comes back, so one-shot clients
    // (e.g. rotating IPv6 addresses) would grow the map without bound. Sweep at
    // most once per window so a full map of active keys is not rescanned on
    // every request.
    if (hits.size >= maxKeys && now - lastSweep >= windowMs) {
      lastSweep = now;
      for (const [stale, rows] of hits) {
        if (now - (rows.at(-1) ?? 0) >= windowMs) hits.delete(stale);
      }
    }
    const rows = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
    if (rows.length >= max) {
      hits.set(key, rows);
      return true;
    }
    rows.push(now);
    hits.set(key, rows);
    return false;
  }
  return Object.assign(limited, { trackedKeys: () => hits.size });
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "local";
}
