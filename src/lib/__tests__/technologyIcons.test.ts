import { describe, expect, it } from "vitest";
import { GET, dynamic } from "@/app/technology-icons.svg/route";
import { TECHNOLOGY_BRANDS } from "@/lib/technologyIcons";

describe("local technology sprite", () => {
  it("prerenders a cacheable SVG containing every mapped brand exactly once", async () => {
    expect(dynamic).toBe("force-static");
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe("image/svg+xml; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toContain("public, max-age=86400");
    const svg = await response.text();
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg">/);
    for (const icon of Object.values(TECHNOLOGY_BRANDS)) {
      expect(svg.split(`id="${icon.slug}"`)).toHaveLength(2);
      expect(svg).toContain(`<path d="${icon.path}"/>`);
    }
    expect(svg).not.toMatch(/<script|<foreignObject|href=/);
  });
});
