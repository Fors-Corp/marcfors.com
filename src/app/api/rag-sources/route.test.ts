import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rag", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rag")>("@/lib/rag");
  return {
    ...actual,
    databaseUrl: vi.fn(() => null),
    getSql: vi.fn(),
  };
});

import { GET } from "@/app/api/rag-sources/route";
import { databaseUrl, getSql } from "@/lib/rag";

describe("GET /api/rag-sources", () => {
  afterEach(() => {
    vi.mocked(databaseUrl).mockReturnValue(null);
    vi.clearAllMocks();
  });

  it("returns 503 when the database is not configured", async () => {
    const response = await GET(new Request("http://localhost/api/rag-sources"));
    expect(response.status).toBe(503);
  });

  it("lists indexed source paths", async () => {
    vi.mocked(databaseUrl).mockReturnValue("postgresql://example");
    vi.mocked(getSql).mockReturnValue((async () => [
      { source_path: "about.md" },
      { source_path: "projects.md" },
    ]) as never);
    const response = await GET(new Request("http://localhost/api/rag-sources"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      files: ["about.md", "projects.md"],
    });
  });
});
