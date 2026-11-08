import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeferredAskWidget } from "@/components/DeferredAskWidget";
import { askChatWidgetStrings } from "@/lib/askStrings";
import { copy } from "@/data/copy";

const strings = askChatWidgetStrings(copy.en);

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

function installIdleGate() {
  let pending: IdleCallback | null = null;
  const cancel = vi.fn();
  vi.stubGlobal("requestIdleCallback", (cb: IdleCallback) => {
    pending = cb;
    return 7;
  });
  vi.stubGlobal("cancelIdleCallback", cancel);
  return {
    cancel,
    fire() {
      const cb = pending;
      pending = null;
      cb?.({ didTimeout: false, timeRemaining: () => 50 });
    },
  };
}

function Page() {
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <>
      <main data-page-root="">
        <a href="#work">Work</a>
        <button ref={ref} type="button">
          Outside
        </button>
      </main>
      <DeferredAskWidget strings={strings} />
    </>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
  vi.mocked(usePathname).mockReturnValue("/");
});

describe("DeferredAskWidget", () => {
  it("stays off the first paint, then opens on idle and inerts the page without taking focus", async () => {
    const idle = installIdleGate();
    render(<Page />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();

    idle.fire();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(document.querySelector("main")).toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: copy.en.askPlaceholder })).not.toHaveFocus();
  });

  it("mounts on the first pointer or key before idle, and ignores a second mount", async () => {
    const idle = installIdleGate();
    render(<Page />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    window.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    idle.fire();
    window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(document.querySelector("main")).toHaveAttribute("inert");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("keeps Escape, the focus trap, and focus restore after the deferred mount", async () => {
    const user = userEvent.setup();
    const idle = installIdleGate();
    render(<Page />);
    idle.fire();

    const input = await screen.findByRole("textbox", { name: copy.en.askPlaceholder });
    const close = screen.getByRole("button", { name: copy.en.askWidgetClose });
    input.focus();
    await user.tab();
    expect(close).toHaveFocus();
    expect(screen.getByRole("link", { name: "Work" })).not.toHaveFocus();

    await user.keyboard("{Escape}");
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    const launcher = screen.getByRole("button", { name: copy.en.askWidgetOpen });
    expect(launcher).toHaveFocus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not inert the page when a stored closed state mounts after idle", async () => {
    sessionStorage.setItem("marcfors-ask-widget-open", "0");
    const idle = installIdleGate();
    render(<Page />);
    idle.fire();

    expect(await screen.findByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
  });

  it("uses a short timeout when the browser has no requestIdleCallback", async () => {
    vi.stubGlobal("requestIdleCallback", undefined);
    render(<Page />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(document.querySelector("main")).toHaveAttribute("inert");
  });

  it("cancels a pending idle mount on unmount", () => {
    const idle = installIdleGate();
    const { unmount } = render(<Page />);
    unmount();
    expect(idle.cancel).toHaveBeenCalled();
    idle.fire();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
