import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const LINK = "https://buy.stripe.com/test_abc123";
const SITE_LINK = "https://buy.stripe.com/bJe00c4WK3orgIq88jaAw01";
const get = (query = "") => GET(new NextRequest(new URL(`/donate${query}`, "http://localhost")));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("GET /donate", () => {
  it("302s to the configured Payment Link, tagged with an allowlisted project", () => {
    vi.stubEnv("STRIPE_SUPPORT_LINK_URL", LINK);
    const res = get("?from=habitus");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`${LINK}?client_reference_id=habitus`);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("drops an unknown source but still redirects to the project link", () => {
    vi.stubEnv("STRIPE_SUPPORT_LINK_URL", LINK);
    vi.stubEnv("STRIPE_SITE_SUPPORT_LINK_URL", SITE_LINK);
    expect(get("?from=evil%26client_reference_id%3Dx").headers.get("location")).toBe(LINK);
    expect(get("?from=").headers.get("location")).toBe(LINK);
  });

  it("sends the site's own Support button (no from) to the site Payment Link, untagged", () => {
    vi.stubEnv("STRIPE_SUPPORT_LINK_URL", LINK);
    vi.stubEnv("STRIPE_SITE_SUPPORT_LINK_URL", SITE_LINK);
    const res = get();
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(SITE_LINK);
  });

  it("keeps project tips on the project link even when the site link is set", () => {
    vi.stubEnv("STRIPE_SUPPORT_LINK_URL", LINK);
    vi.stubEnv("STRIPE_SITE_SUPPORT_LINK_URL", SITE_LINK);
    expect(get("?from=wordkeep").headers.get("location")).toBe(`${LINK}?client_reference_id=wordkeep`);
  });

  it("fails visibly for the site button when only the project link is set", async () => {
    vi.stubEnv("STRIPE_SUPPORT_LINK_URL", LINK);
    vi.stubEnv("STRIPE_SITE_SUPPORT_LINK_URL", "");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = get();
    expect(res.status).toBe(500);
    expect(res.headers.get("location")).toBeNull();
    expect(error).toHaveBeenCalledWith(expect.stringContaining("STRIPE_SITE_SUPPORT_LINK_URL"));
  });

  it("fails visibly with a 500 and a log line when the link is unset", async () => {
    vi.stubEnv("STRIPE_SUPPORT_LINK_URL", "");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = get("?from=fors");
    expect(res.status).toBe(500);
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.text()).toMatch(/not configured/);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("STRIPE_SUPPORT_LINK_URL"));
  });

  it("refuses a non-https link rather than redirecting to it", () => {
    vi.stubEnv("STRIPE_SUPPORT_LINK_URL", "http://buy.stripe.com/test_abc123");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(get("?from=fors").status).toBe(500);
  });
});
