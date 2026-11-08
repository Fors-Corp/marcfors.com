import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const neon = vi.hoisted(() =>
  vi.fn((url: string) => {
    if (url.includes("throw.example")) {
      throw new Error(`connect failed for ${url}`);
    }
    return Object.assign(() => Promise.resolve([]), { query: vi.fn() });
  }),
);

vi.mock("@neondatabase/serverless", () => ({
  neon,
}));

import { databaseUrl, getSql } from "@/lib/rag/db";

const saved = {
  database: process.env.DATABASE_URL,
  postgres: process.env.POSTGRES_URL,
};

function restore(name: "DATABASE_URL" | "POSTGRES_URL", value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

beforeEach(() => {
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
});

afterEach(() => {
  restore("DATABASE_URL", saved.database);
  restore("POSTGRES_URL", saved.postgres);
  neon.mockClear();
});

describe("database url", () => {
  it("returns null when unset, blank, non-postgres, or sslmode=disable", () => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    expect(databaseUrl()).toBeNull();

    process.env.DATABASE_URL = "   ";
    process.env.POSTGRES_URL = "postgresql://user:supersecret@localhost/db?sslmode=require";
    expect(databaseUrl()).toContain("sslmode=require");

    process.env.DATABASE_URL = "https://user:supersecret@example.test/db";
    expect(databaseUrl()).toBeNull();

    process.env.DATABASE_URL = "postgresql://user:supersecret@localhost/db?sslmode=disable";
    expect(databaseUrl()).toBeNull();

    process.env.DATABASE_URL = "postgresql://user:supersecret@localhost/db?SSLMODE=Disable";
    expect(databaseUrl()).toBeNull();

    process.env.DATABASE_URL = "not a url";
    expect(databaseUrl()).toBeNull();

    process.env.DATABASE_URL = "postgresql://user:supersecret@localhost/db\n?sslmode=require";
    expect(databaseUrl()).toBeNull();
  });

  it("prefers DATABASE_URL and accepts postgres and postgresql schemes", () => {
    process.env.DATABASE_URL = "postgres://user:supersecret@localhost/db";
    process.env.POSTGRES_URL = "postgresql://other:othersecret@localhost/other";
    expect(databaseUrl()).toBe("postgres://user:supersecret@localhost/db");
    process.env.DATABASE_URL = "postgresql://user:supersecret@localhost/db?sslmode=require";
    expect(databaseUrl()).toContain("sslmode=require");
  });

  it("does not put the connection string on a driver failure", () => {
    process.env.DATABASE_URL = "postgresql://user:supersecret@throw.example/db?sslmode=require";
    expect(() => getSql()).toThrow(/postgres connection refused/);
    try {
      getSql();
    } catch (error) {
      expect(String(error)).not.toContain("supersecret");
      expect(String(error)).not.toContain("throw.example");
    }
  });

  it("returns a query function for a usable url without echoing it", () => {
    process.env.DATABASE_URL = "postgresql://user:supersecret@localhost/db?sslmode=require";
    const sql = getSql();
    expect(typeof sql).toBe("function");
    expect(neon).toHaveBeenCalledWith(
      "postgresql://user:supersecret@localhost/db?sslmode=require",
    );
  });

  it("refuses to construct a client when the url is unusable", () => {
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    expect(() => getSql()).toThrow(/DATABASE_URL is required/);
    expect(neon).not.toHaveBeenCalled();
  });
});
