import { describe, expect, it } from "vitest";
import { looksLikeUtf8Mojibake, repairUtf8Mojibake } from "@/lib/rag/mojibake";

function mangleAs(label: string, text: string): string {
  return new TextDecoder(label).decode(new TextEncoder().encode(text));
}

const SPANISH =
  "Sí, Marc está abierto a roles de ingeniería. Consulta la página. El único correo público. ¿remoto? ¡Hola! Françesc a Gràcia; añade.";

describe("repairUtf8Mojibake", () => {
  it("restores Spanish accents mangled as ISO-8859-2 (screenshot pattern)", () => {
    // Production screenshot: estĂĄ / pĂĄgina / Ăşnico / pĂşblico
    const mangled = mangleAs("iso-8859-2", SPANISH);
    expect(mangled).toContain("estĂĄ");
    expect(mangled).toContain("pĂĄgina");
    expect(repairUtf8Mojibake(mangled)).toBe(SPANISH);
  });

  it("restores Spanish accents mangled as Windows-1250", () => {
    const mangled = mangleAs("windows-1250", SPANISH);
    expect(mangled).toContain("estĂˇ");
    expect(repairUtf8Mojibake(mangled)).toBe(SPANISH);
  });

  it("restores Spanish accents mangled as Windows-1252", () => {
    const mangled = mangleAs("windows-1252", SPANISH);
    expect(mangled).toContain("estÃ¡");
    expect(repairUtf8Mojibake(mangled)).toBe(SPANISH);
  });

  it("leaves correct Unicode and English alone", () => {
    expect(repairUtf8Mojibake(SPANISH)).toBe(SPANISH);
    expect(repairUtf8Mojibake("Wordkeep teaches languages.")).toBe(
      "Wordkeep teaches languages.",
    );
    expect(looksLikeUtf8Mojibake(SPANISH)).toBe(false);
  });

  it("is idempotent after a repair", () => {
    const mangled = mangleAs("iso-8859-2", SPANISH);
    const once = repairUtf8Mojibake(mangled);
    expect(once).toBe(SPANISH);
    expect(repairUtf8Mojibake(once)).toBe(once);
  });

  it("round-trips UTF-8 Spanish sample bytes through legacy misdecode", () => {
    const sample = "está página único público";
    const utf8 = new TextEncoder().encode(sample);
    expect(new TextDecoder("utf-8").decode(utf8)).toBe(sample);
    for (const label of ["iso-8859-2", "windows-1250", "windows-1252"] as const) {
      const mangled = new TextDecoder(label).decode(utf8);
      expect(looksLikeUtf8Mojibake(mangled)).toBe(true);
      expect(repairUtf8Mojibake(mangled)).toBe(sample);
    }
  });
});
