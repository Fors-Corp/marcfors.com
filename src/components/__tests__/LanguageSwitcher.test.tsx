import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { copy } from "@/data/copy";
import { LOCALE_CODES, LOCALE_KEY, LOCALE_LABELS, LOCALES } from "@/lib/locale";

const { pathname } = vi.hoisted(() => ({ pathname: { value: "/" } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => pathname.value,
}));

beforeEach(() => {
  pathname.value = "/";
  window.localStorage.clear();
});

afterEach(() => vi.restoreAllMocks());

describe("LanguageSwitcher", () => {
  it("opens as a dropdown with every locale linked and the current one marked", async () => {
    pathname.value = "/de/work/iterm-studio";
    const { container } = render(<LanguageSwitcher locale="de" langLabel={copy.de.lang} />);
    expect(screen.getByRole("group", { name: copy.de.lang })).toBeInTheDocument();
    const trigger = container.querySelector("summary.chrome-menu-trigger");
    expect(trigger).toHaveAttribute("aria-label", copy.de.lang);
    expect(trigger).toHaveTextContent("DE");

    await userEvent.click(trigger!);
    const de = screen.getByRole("link", { name: "DE · Deutsch" });
    expect(de).toHaveAttribute("aria-current", "page");
    expect(de).toHaveAttribute("hreflang", "de");

    const es = screen.getByRole("link", { name: "ES · Español" });
    expect(es).toHaveAttribute("href", "/es/work/iterm-studio");
    expect(es).not.toHaveAttribute("aria-current");
  });

  it("includes each visible language code in its accessible name for voice control", () => {
    render(<LanguageSwitcher locale="en" langLabel={copy.en.lang} />);
    for (const locale of LOCALES) {
      const link = screen.getByRole("link", { name: `${LOCALE_CODES[locale]} · ${LOCALE_LABELS[locale]}` });
      expect(link).toHaveTextContent(LOCALE_CODES[locale]);
    }
  });

  it("remembers the locale when a language link is chosen", async () => {
    pathname.value = "/print";
    const { container } = render(<LanguageSwitcher locale="en" langLabel={copy.en.lang} />);
    await userEvent.click(container.querySelector("summary.chrome-menu-trigger")!);
    await userEvent.click(screen.getByRole("link", { name: "CA · Català" }));

    expect(window.localStorage.getItem(LOCALE_KEY)).toBe("ca");
  });
});
