import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ATLAS_IDLE_TIMEOUT_MS, WordAtlasLazy } from "@/components/WordAtlasLazy";

type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

vi.mock("@/components/WordAtlas", () => ({
  WordAtlas: ({ locale }: { locale: string }) => <div data-testid="atlas">{locale}</div>,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WordAtlasLazy", () => {
  it("keeps the sized placeholder until load idle loads the atlas", async () => {
    let pending: IdleCallback | null = null;
    let timeoutMs = 0;
    vi.stubGlobal("requestIdleCallback", (cb: IdleCallback, opts?: { timeout?: number }) => {
      pending = cb;
      timeoutMs = opts?.timeout ?? 0;
      return 11;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());

    render(<WordAtlasLazy locale="en" variant="hero" />);
    expect(document.querySelector(".atlas-stage--loading")).toBeInTheDocument();
    expect(screen.queryByTestId("atlas")).not.toBeInTheDocument();
    expect(timeoutMs).toBe(ATLAS_IDLE_TIMEOUT_MS);

    await act(async () => {
      pending?.({ didTimeout: false, timeRemaining: () => 50 });
    });

    expect(await screen.findByTestId("atlas")).toHaveTextContent("en");
    expect(document.querySelector(".atlas-stage--loading")).not.toBeInTheDocument();
  });

  it("waits for the window load event before arming idle when the document is still loading", async () => {
    let pending: IdleCallback | null = null;
    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "loading",
    });
    vi.stubGlobal("requestIdleCallback", (cb: IdleCallback) => {
      pending = cb;
      return 12;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());

    render(<WordAtlasLazy locale="en" variant="hero" />);
    expect(screen.queryByTestId("atlas")).not.toBeInTheDocument();
    expect(pending).toBeNull();

    await act(async () => {
      window.dispatchEvent(new Event("load"));
    });
    expect(pending).not.toBeNull();

    await act(async () => {
      pending?.({ didTimeout: false, timeRemaining: () => 50 });
    });
    expect(await screen.findByTestId("atlas")).toHaveTextContent("en");

    Object.defineProperty(document, "readyState", {
      configurable: true,
      get: () => "complete",
    });
  });
});
