import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ASK_IDLE_TIMEOUT_MS,
  DeferredAskWidget,
} from "@/components/DeferredAskWidget";
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
  let timeoutMs = 0;
  const cancel = vi.fn();
  vi.stubGlobal(
    "requestIdleCallback",
    (cb: IdleCallback, opts?: { timeout?: number }) => {
      pending = cb;
      timeoutMs = opts?.timeout ?? 0;
      return 7;
    },
  );
  vi.stubGlobal("cancelIdleCallback", cancel);
  return {
    cancel,
    timeoutMs: () => timeoutMs,
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
  vi.useRealTimers();
  sessionStorage.clear();
  vi.mocked(usePathname).mockReturnValue("/");
});

describe("DeferredAskWidget", () => {
  it("stays off the first paint, then mounts closed after load idle without locking the page", async () => {
    const idle = installIdleGate();
    render(<Page />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    expect(idle.timeoutMs()).toBe(ASK_IDLE_TIMEOUT_MS);

    idle.fire();
    expect(await screen.findByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
  });

  it("mounts on the first pointer or key before idle, and ignores a second mount", async () => {
    const idle = installIdleGate();
    render(<Page />);
    expect(screen.queryByRole("button", { name: copy.en.askWidgetOpen })).not.toBeInTheDocument();

    window.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(await screen.findByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector("main")).not.toHaveAttribute("inert");

    idle.fire();
    window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" }));
    expect(screen.getAllByRole("button", { name: copy.en.askWidgetOpen })).toHaveLength(1);
  });

  it("keeps Escape and focus restore after an intentional open without locking the page", async () => {
    const user = userEvent.setup();
    render(<Page />);
    window.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

    const launcher = await screen.findByRole("button", { name: copy.en.askWidgetOpen });
    await user.click(launcher);
    const input = screen.getByRole("textbox", { name: copy.en.askPlaceholder });
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(input).toHaveFocus();
    expect(screen.getByRole("link", { name: "Work" })).toBeEnabled();

    await user.keyboard("{Escape}");
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: copy.en.askWidgetOpen })).toHaveFocus();
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

  it("restores a stored open panel after idle without stealing focus or double-mounting", async () => {
    sessionStorage.setItem("marcfors-ask-widget-open", "1");
    const idle = installIdleGate();
    render(<Page />);
    idle.fire();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: copy.en.askPlaceholder })).not.toHaveFocus();
  });

  it("mounts after load when the browser has no requestIdleCallback", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("requestIdleCallback", undefined);
    render(<Page />);
    expect(screen.queryByRole("button", { name: copy.en.askWidgetOpen })).not.toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(await screen.findByRole("button", { name: copy.en.askWidgetOpen })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector("main")).not.toHaveAttribute("inert");
  });

  it("cancels a pending idle mount on unmount", () => {
    const idle = installIdleGate();
    const { unmount } = render(<Page />);
    unmount();
    expect(idle.cancel).toHaveBeenCalled();
    idle.fire();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.en.askWidgetOpen })).not.toBeInTheDocument();
  });
});
