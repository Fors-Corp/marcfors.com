import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { RELEASE_DATE, SITE_HOST, SITE_VERSION } from "@/lib/site";

describe("GET /api/health", () => {
  it("reports encryption, audit, and version without leaking a personal mailbox", async () => {
    const response = GET();
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.service).toBe(SITE_HOST);
    expect(body.version).toBe(SITE_VERSION);
    expect(body.releasedAt).toBe(RELEASE_DATE);
    expect(body.encryption.hsts).toBe(true);
    // The locale cookie exists (prefs.writeLocale), so "none" would be untrue.
    expect(body.encryption.cookies).toBe("preference-only");
    expect(body.headers).toContain("Content-Security-Policy");
    expect(JSON.stringify(body)).not.toMatch(/@gmail\.com/i);
  });
});
