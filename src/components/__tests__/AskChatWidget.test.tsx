import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AskChatWidget } from "@/components/AskChatWidget";
import { askChatWidgetStrings } from "@/lib/askStrings";
import { copy } from "@/data/copy";

const strings = askChatWidgetStrings(copy.en);

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
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

  it("closes on a source link and keeps the thread", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            answer: "He builds products at his practice (experience.md).",
            citations: [{ source_path: "experience.md", chunk_index: 0, distance: 0.12 }],
            embedding_model: "local/x",
            chat_model: "claude",
            run_id: null,
          }),
      }),
    );
    render(<AskChatWidget strings={strings} />);
    await user.click(screen.getByRole("button", { name: copy.en.askSamples[0] }));
    const sources = await screen.findAllByRole("link", { name: "experience.md" });
    await user.click(sources[0]!);
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "experience.md" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.en.askWidgetOpen }));
    expect(screen.getByText(/He builds products at his practice/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "experience.md" }).length).toBeGreaterThan(0);
  });
});
