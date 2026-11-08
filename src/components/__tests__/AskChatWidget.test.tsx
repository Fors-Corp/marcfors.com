import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AskChatWidget } from "@/components/AskChatWidget";
import { askChatWidgetStrings } from "@/lib/askStrings";
import { copy } from "@/data/copy";

const strings = askChatWidgetStrings(copy.en);

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("AskChatWidget", () => {
  it("opens by default and can be closed then reopened", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ files: [], embedding_model: "local/x" }),
      }),
    );
    render(<AskChatWidget strings={strings} />);
    expect(screen.getByRole("button", { name: copy.en.askWidgetClose })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(copy.en.askPlaceholder)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.en.askSamples[0] })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.en.askWidgetClose }));
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.en.askWidgetOpen }));
    expect(screen.getByRole("button", { name: copy.en.askWidgetClose })).toBeInTheDocument();
  });
});
