import { describe, expect, it } from "vitest";
import { CLIENT_REFERENCE_ID, SUPPORT_SOURCES, supportRedirectUrl, supportSource } from "@/lib/support";

const LINK = "https://buy.stripe.com/test_abc123";

describe("support source allowlist", () => {
  it("holds exactly the 13 in-scope projects, each a valid Stripe client_reference_id", () => {
    expect(SUPPORT_SOURCES).toHaveLength(13);
    expect(new Set(SUPPORT_SOURCES).size).toBe(13);
    for (const slug of SUPPORT_SOURCES) expect(slug, slug).toMatch(CLIENT_REFERENCE_ID);
  });

  it("keeps client and archived repos out", () => {
    for (const slug of ["art44-web", "trading-bot", "mlaas", "pharmanetic", "business-management-system"]) {
      expect(supportSource(slug), slug).toBeNull();
    }
  });

  it("accepts only exact, case-sensitive matches", () => {
    expect(supportSource("hyper-top")).toBe("hyper-top");
    for (const bad of [null, undefined, "", "Hyper-Top", " hyper-top", "hyper-top ", "hyper-top&x=1", "../fors", "x".repeat(201)]) {
      expect(supportSource(bad), String(bad)).toBeNull();
    }
  });
});

describe("supportRedirectUrl", () => {
  it("tags an allowlisted source as client_reference_id", () => {
    const url = supportRedirectUrl(LINK, "wordkeep");
    expect(url?.toString()).toBe(`${LINK}?client_reference_id=wordkeep`);
  });

  it("sends unknown or missing sources to the bare link, untagged", () => {
    expect(supportRedirectUrl(LINK, null)?.toString()).toBe(LINK);
    expect(supportRedirectUrl(LINK, "<script>")?.toString()).toBe(LINK);
  });

  it("keeps the link's own query and overrides a pre-set client_reference_id", () => {
    const url = supportRedirectUrl(`${LINK}?locale=es&client_reference_id=stale`, "fors");
    expect(url?.searchParams.get("locale")).toBe("es");
    expect(url?.searchParams.getAll("client_reference_id")).toEqual(["fors"]);
  });

  it("refuses a missing, malformed or non-https link instead of guessing one", () => {
    for (const bad of [undefined, "", "not a url", "http://buy.stripe.com/test_abc123", "javascript:alert(1)"]) {
      expect(supportRedirectUrl(bad, "fors"), String(bad)).toBeNull();
    }
  });
});
