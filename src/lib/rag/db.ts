import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

export function databaseUrl(): string | null {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url?.trim() || null;
}

export function getSql(): Sql {
  const url = databaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  return neon(url);
}
