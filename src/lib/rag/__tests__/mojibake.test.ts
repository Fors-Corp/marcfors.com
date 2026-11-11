import { describe, expect, it } from "vitest";
import { looksLikeUtf8Mojibake, repairUtf8Mojibake } from "@/lib/rag/mojibake";

describe("repairUtf8Mojibake", () => {
  it("restores Spanish accents mangled as Windows-1250", () => {
    const mangled =
      "SĂ\xAD, Marc estĂˇ abierto a roles de ingenierĂ\xADa. Consulta la pĂˇgina.";
    expect(repairUtf8Mojibake(mangled)).toBe(
      "Sí, Marc está abierto a roles de ingeniería. Consulta la página.",
    );
  });

  it("restores Spanish accents mangled as Windows-1252", () => {
    const mangled = "SÃ\xAD, Marc estÃ¡ abierto. SegÃºn su CV (pÃ¡gina).";
    expect(repairUtf8Mojibake(mangled)).toBe(
      "Sí, Marc está abierto. Según su CV (página).",
    );
  });

  it("restores inverted punctuation and Catalan/Portuguese marks", () => {
    expect(repairUtf8Mojibake("ÂżHola!")).toBe("¿Hola!");
    expect(repairUtf8Mojibake("Â¿Hola!")).toBe("¿Hola!");
    expect(repairUtf8Mojibake("ÂˇAtenciĂłn!")).toBe("¡Atención!");
    expect(repairUtf8Mojibake("FranĂ§esc a GrĂ\xA0cia")).toBe("Françesc a Gràcia");
  });

  it("leaves correct Unicode and English alone", () => {
    const ok =
      "Sí, Marc está abierto a puestos en remoto. Según about.md y contact.md.";
    expect(repairUtf8Mojibake(ok)).toBe(ok);
    expect(repairUtf8Mojibake("Wordkeep teaches languages.")).toBe(
      "Wordkeep teaches languages.",
    );
    expect(looksLikeUtf8Mojibake(ok)).toBe(false);
  });

  it("is idempotent after a repair", () => {
    const mangled = "SĂ\xAD, estĂˇ, pĂˇgina, ingenierĂ\xADa, Âżremoto?";
    const once = repairUtf8Mojibake(mangled);
    expect(once).toBe("Sí, está, página, ingeniería, ¿remoto?");
    expect(repairUtf8Mojibake(once)).toBe(once);
  });
});
