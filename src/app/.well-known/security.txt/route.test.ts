import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { LOCALES } from "@/lib/locale";
import { DEV_EMAIL, SITE_URL } from "@/lib/site";

describe("GET /.well-known/security.txt", () => {
  it("points disclosures at the developer mailbox", async () => {
    const response = GET();
    const body = await response.text();
    expect(response.headers.get("Content-Type")).toMatch(/text\/plain/);
    expect(body).toContain(`Contact: mailto:${DEV_EMAIL}`);
    expect(body).toContain(`Canonical: ${SITE_URL}/.well-known/security.txt`);
    expect(body).not.toMatch(/@gmail\.com/i);
  });

  it("lists every site locale as a preferred language", async () => {
    const body = await GET().text();
    expect(body).toContain(`Preferred-Languages: ${LOCALES.join(", ")}`);
    expect(body).toMatch(/Preferred-Languages: .*\bfr\b/);
  });
});
