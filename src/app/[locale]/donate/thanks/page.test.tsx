import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { copy } from "@/data/copy";
import { LOCALES } from "@/lib/locale";
import SupportThanksPage, { generateMetadata } from "./page";

const params = (locale: string) => ({ params: Promise.resolve({ locale }) });

describe("/donate/thanks", () => {
  it("thanks the visitor in every locale and links back home", async () => {
    for (const locale of LOCALES) {
      const { unmount } = render(await SupportThanksPage(params(locale)));
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy[locale].supportThanksTitle);
      expect(screen.getByText(copy[locale].supportThanksBody)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: copy[locale].homeCta })).toHaveAttribute(
        "href",
        locale === "en" ? "/" : `/${locale}`,
      );
      unmount();
    }
  });

  it("stays out of the index", async () => {
    const meta = await generateMetadata(params("es"));
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates?.canonical).toBe("https://marcfors.com/es/donate/thanks");
  });

  it("says Support, never donate, in the visible copy", () => {
    for (const locale of LOCALES) {
      const { supportLink, supportThanksTitle, supportThanksBody } = copy[locale];
      expect(supportLink, locale).toMatch(/· 1,99 €$/);
      expect(`${supportLink} ${supportThanksTitle} ${supportThanksBody}`, locale).not.toMatch(
        /donat|donaci|spende|doa[çc]/i,
      );
    }
  });
});
