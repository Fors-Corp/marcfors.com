import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { AskChatWidget } from "@/components/AskChatWidget";
import { askChatWidgetStrings } from "@/lib/askStrings";
import { copy } from "@/data/copy";

const strings = askChatWidgetStrings(copy.en);

function rememberOpen() {
  sessionStorage.setItem("marcfors-ask-widget-open", "1");
}

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

function PageWithAsk() {
  return (
    <>
      <main data-page-root="">
        <a href="#work">Work</a>
        <section id="work" tabIndex={-1}>
          Work section
        </section>
      </main>
      <AskChatWidget strings={strings} />
    </>
  );
}

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
  vi.mocked(usePathname).mockReturnValue("/");
  window.location.hash = "";
});


function jsonResponse(payload: unknown, init: { ok?: boolean; status?: number } = {}) {
  const body = new TextEncoder().encode(JSON.stringify(payload));
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    arrayBuffer: async () =>
      body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  };
}

describe("AskChatWidget", () => {
  it("starts closed and can be opened then closed", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ files: [], embedding_model: "local/x" })),
    );
    render(<AskChatWidget strings={strings} />);
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.en.askWidgetOpen }));
    expect(screen.getByRole("button", { name: copy.en.askWidgetClose })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(copy.en.askPlaceholder)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.en.askSamples[0] })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.en.askWidgetClose }));
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();
  });

  it("closes on a source link, focuses the hash target, and keeps the thread", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({
            answer: "He builds products at his practice (experience.md).",
            citations: [{ source_path: "experience.md", chunk_index: 0, distance: 0.12 }],
            embedding_model: "local/x",
            chat_model: "claude",
            run_id: null,
          })),
    );
    // Hash target must exist for close-for-navigation to land focus there.
    document.body.insertAdjacentHTML(
      "beforeend",
      '<section id="work" tabindex="-1">Work section</section>',
    );
    window.history.replaceState(null, "", "/#work");
    rememberOpen();
    render(<AskChatWidget strings={strings} />);
    await user.click(screen.getByRole("button", { name: copy.en.askSamples[0] }));
    const sources = await screen.findAllByRole("link", { name: "experience.md" });
    for (const source of sources) {
      expect(source).toHaveAttribute("href", "/#work");
      expect(source).toHaveAccessibleName("experience.md");
      expect(source).not.toHaveAttribute("title");
    }
    await user.click(sources[0]!);
    expect(document.getElementById("work")).toHaveFocus();
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).not.toHaveFocus();
    expect(screen.queryByRole("link", { name: "experience.md" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.en.askWidgetOpen }));
    expect(screen.getByText(/He builds products at his practice/)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "experience.md" }).length).toBeGreaterThan(0);
    document.getElementById("work")?.remove();
  });

  it("is a non-modal dialog labelled by the visible title", async () => {
    rememberOpen();
    const { container } = render(<AskChatWidget strings={strings} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "false");
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

  it("keeps the page interactive while the panel is open", async () => {
    const user = userEvent.setup();
    render(<PageWithAsk />);

    const page = document.querySelector("main");
    expect(page).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.en.askWidgetOpen }));
    const dialog = screen.getByRole("dialog");
    expect(page).not.toHaveAttribute("inert");
    expect(page?.closest("[inert]")).toBeNull();
    expect(dialog.closest("[inert]")).toBeNull();
    expect(screen.getByRole("link", { name: "Work" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: copy.en.askPlaceholder })).toHaveFocus();

    await user.click(screen.getByRole("link", { name: "Work" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(page).not.toHaveAttribute("inert");
    expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).toHaveFocus();
  });

  it("does not mark the page inert when closed or on the full Ask page", () => {
    const { unmount } = render(<PageWithAsk />);
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
    unmount();

    vi.mocked(usePathname).mockReturnValue("/es/ask");
    render(<PageWithAsk />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
  });

  it("closes on Escape and restores focus to the launcher", async () => {
    const user = userEvent.setup();
    render(<AskChatWidget strings={strings} />);
    await user.click(screen.getByRole("button", { name: copy.en.askWidgetOpen }));
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
    const launcher = screen.getByRole("button", { name: copy.en.askWidgetOpen });
    await user.click(launcher);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: copy.en.askPlaceholder })).toHaveFocus();
  });

  it("lifts the fab with visualViewport insets while the panel is open", async () => {
    const user = userEvent.setup();
    const listeners = new Map<string, Set<() => void>>();
    const vv = {
      height: 400,
      offsetTop: 0,
      addEventListener: (type: string, listener: () => void) => {
        const set = listeners.get(type) ?? new Set();
        set.add(listener);
        listeners.set(type, set);
      },
      removeEventListener: (type: string, listener: () => void) => {
        listeners.get(type)?.delete(listener);
      },
    };
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
    vi.stubGlobal("visualViewport", vv);

    const { container } = render(<AskChatWidget strings={strings} />);
    const fab = container.querySelector(".ask-fab") as HTMLElement;
    expect(fab).toBeTruthy();
    expect(fab.style.getPropertyValue("--ask-vv-bottom")).toBe("");

    await user.click(screen.getByRole("button", { name: copy.en.askWidgetOpen }));
    expect(fab.style.getPropertyValue("--ask-vv-bottom")).toBe("444px");
    expect(fab.style.getPropertyValue("--ask-vv-height")).toBe("400px");

    vv.height = 844;
    for (const listener of listeners.get("resize") ?? []) listener();
    expect(fab.style.getPropertyValue("--ask-vv-bottom")).toBe("0px");
    expect(fab.style.getPropertyValue("--ask-vv-height")).toBe("844px");

    await user.click(screen.getByRole("button", { name: copy.en.askWidgetClose }));
    expect(fab.style.getPropertyValue("--ask-vv-bottom")).toBe("");
    expect(fab.style.getPropertyValue("--ask-vv-height")).toBe("");
  });

  it("lets Tab leave the open panel so the rest of the page stays reachable", async () => {
    const user = userEvent.setup();
    rememberOpen();
    render(
      <>
        <AskChatWidget strings={strings} />
        <button type="button">After</button>
      </>,
    );
    const input = screen.getByRole("textbox", { name: copy.en.askPlaceholder });
    const after = screen.getByRole("button", { name: "After" });
    expect(screen.getByRole("button", { name: copy.en.askSubmit })).toBeDisabled();

    input.focus();
    // No focus trap: keep tabbing until focus reaches the sibling control.
    for (let i = 0; i < 8 && after !== document.activeElement; i += 1) {
      await user.tab();
    }
    expect(after).toHaveFocus();
  });

  it("does not move focus on mount when a stored open state is restored", () => {
    rememberOpen();
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
      vi.fn().mockResolvedValue(jsonResponse({
            answer: "Embedded RAG retrieves portfolio pages.",
            citations: [],
            embedding_model: "local/x",
            chat_model: "claude",
            run_id: null,
          })),
    );
    rememberOpen();
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
