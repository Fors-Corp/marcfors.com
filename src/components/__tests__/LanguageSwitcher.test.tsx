import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { copy } from "@/data/copy";
import { LOCALE_CODES, LOCALE_KEY, LOCALE_LABELS, LOCALES } from "@/lib/locale";

const { push, pathname } = vi.hoisted(() => ({ push: vi.fn(), pathname: { value: "/" } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname.value,
}));

beforeEach(() => {
  push.mockClear();
  pathname.value = "/";
  window.localStorage.clear();
});

afterEach(() => vi.restoreAllMocks());

describe("LanguageSwitcher", () => {
  it("links every locale and marks the current one", () => {
    pathname.value = "/de/work/iterm-studio";
    render(<LanguageSwitcher locale="de" langLabel={copy.de.lang} />);
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

  it("navigates and remembers the locale when the select changes", async () => {
    pathname.value = "/print";
    render(<LanguageSwitcher locale="en" langLabel={copy.en.lang} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "ca");

    expect(window.localStorage.getItem(LOCALE_KEY)).toBe("ca");
    expect(push).toHaveBeenCalledWith("/ca/print");
  });
});
