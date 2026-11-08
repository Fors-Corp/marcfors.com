import { useLayoutEffect, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { AskChatWidget } from "@/components/AskChatWidget";
import { askChatWidgetStrings } from "@/lib/askStrings";
import { copy } from "@/data/copy";

const strings = askChatWidgetStrings(copy.en);

function FocusOutside() {
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <>
      <button ref={ref} type="button">
        Outside
      </button>
      <AskChatWidget strings={strings} />
    </>
  );
}

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
    for (const source of sources) {
      expect(source).toHaveAttribute("href", "/#work");
      expect(source).toHaveAccessibleName("experience.md");
      expect(source).not.toHaveAttribute("title");
    }
    await user.click(sources[0]!);
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).toHaveFocus();
    expect(screen.queryByRole("link", { name: "experience.md" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.en.askWidgetOpen }));
    expect(screen.getByText(/He builds products at his practice/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "experience.md" }).length).toBeGreaterThan(0);
  });

  it("is a modal dialog labelled by the visible title", async () => {
    const { container } = render(<AskChatWidget strings={strings} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName(copy.en.askWidgetLauncher);
    const title = document.getElementById(dialog.getAttribute("aria-labelledby") ?? "");
    expect(title).toBeVisible();
    expect(title).toHaveTextContent(copy.en.askWidgetLauncher);
    expect(dialog).toContainElement(title);

    const close = screen.getByRole("button", { name: copy.en.askWidgetClose });
    expect(close).toHaveAccessibleName(copy.en.askWidgetClose);
    expect(close).not.toHaveAttribute("title");
    expect(close).not.toHaveAttribute("aria-label");

    const input = screen.getByRole("textbox", { name: copy.en.askPlaceholder });
    expect(input).toHaveAccessibleName(copy.en.askPlaceholder);
    expect(document.querySelector(`label[for="${input.id}"]`)).toHaveTextContent(copy.en.askPlaceholder);
    expect(dialog.querySelector(".ask-thread")).toHaveAttribute("aria-live", "polite");

    expect(await axe(container)).toHaveNoViolations();
  });

  it("closes on Escape and restores focus to the launcher", async () => {
    const user = userEvent.setup();
    render(<AskChatWidget strings={strings} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    const launcher = screen.getByRole("button", { name: copy.en.askWidgetOpen });
    expect(launcher).toHaveFocus();
    expect(launcher).toHaveAccessibleName(copy.en.askWidgetOpen);
    expect(launcher).not.toHaveAttribute("title");
    expect(launcher).toHaveAttribute("aria-haspopup", "dialog");
    expect(launcher).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus into the question field when opened", async () => {
    const user = userEvent.setup();
    render(<AskChatWidget strings={strings} />);
    await user.click(screen.getByRole("button", { name: copy.en.askWidgetClose }));
    const launcher = screen.getByRole("button", { name: copy.en.askWidgetOpen });
    expect(launcher).toHaveFocus();
    await user.click(launcher);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: copy.en.askPlaceholder })).toHaveFocus();
  });

  it("keeps Tab inside the open dialog", async () => {
    const user = userEvent.setup();
    render(
      <>
        <AskChatWidget strings={strings} />
        <button type="button">After</button>
      </>,
    );
    const close = screen.getByRole("button", { name: copy.en.askWidgetClose });
    const input = screen.getByRole("textbox", { name: copy.en.askPlaceholder });
    const after = screen.getByRole("button", { name: "After" });
    expect(screen.getByRole("button", { name: copy.en.askSubmit })).toBeDisabled();

    input.focus();
    await user.tab();
    expect(close).toHaveFocus();
    expect(after).not.toHaveFocus();

    await user.tab({ shift: true });
    expect(input).toHaveFocus();
    expect(after).not.toHaveFocus();
  });

  it("does not move focus on mount when the panel is already open", () => {
    render(<FocusOutside />);
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not focus the launcher when a stored closed state is restored", () => {
    sessionStorage.setItem("marcfors-ask-widget-open", "0");
    render(<FocusOutside />);
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not move focus into the thread when an answer arrives", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            answer: "Embedded RAG retrieves portfolio pages.",
            citations: [],
            embedding_model: "local/x",
            chat_model: "claude",
            run_id: null,
          }),
      }),
    );
    render(<AskChatWidget strings={strings} />);
    const thread = document.querySelector(".ask-thread");
    expect(thread).toHaveAttribute("aria-live", "polite");
    const focus = vi.spyOn(HTMLElement.prototype, "focus");
    await user.click(screen.getByRole("button", { name: copy.en.askSamples[0] }));
    await screen.findByText("Embedded RAG retrieves portfolio pages.");
    const movedIntoThread = focus.mock.instances.some(
      (node) => node instanceof Node && (node === thread || thread?.contains(node)),
    );
    expect(movedIntoThread).toBe(false);
    expect(thread?.contains(document.activeElement)).toBe(false);
    focus.mockRestore();
  });
});
