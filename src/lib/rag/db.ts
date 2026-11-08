import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

function rawDatabaseUrl(): string | null {
  for (const name of ["DATABASE_URL", "POSTGRES_URL"] as const) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return null;
}

function isUsablePostgresUrl(url: string): boolean {
  if (/[\r\n]/.test(url)) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") return false;
  let sslmode: string | null = null;
  for (const [key, value] of parsed.searchParams) {
    if (key.toLowerCase() === "sslmode") sslmode = value.toLowerCase();
  }
  // The HTTP driver still talks TLS to Neon. An explicit disable is a
  // misconfiguration, not a local fallback.
  if (sslmode === "disable") return false;
  return true;
}

// The string includes credentials. Callers may only test it for presence.
// getSql drops driver errors so a thrown message cannot echo the URL.
export function databaseUrl(): string | null {
  const url = rawDatabaseUrl();
  if (!url || !isUsablePostgresUrl(url)) return null;
  return url;
}

export function getSql(): Sql {
  const url = databaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  try {
    return neon(url);
  } catch {
    throw new Error("postgres connection refused");
  }
}
