import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { WordAtlasLazy } from "@/components/WordAtlasLazy";

type IdleCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;

vi.mock("@/components/WordAtlas", () => ({
  WordAtlas: ({ locale }: { locale: string }) => <div data-testid="atlas">{locale}</div>,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WordAtlasLazy", () => {
  it("keeps the sized placeholder until an idle callback loads the atlas", async () => {
    let pending: IdleCallback | null = null;
    vi.stubGlobal("requestIdleCallback", (cb: IdleCallback) => {
      pending = cb;
      return 11;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());

    render(<WordAtlasLazy locale="en" variant="hero" />);
    expect(document.querySelector(".atlas-stage--loading")).toBeInTheDocument();
    expect(screen.queryByTestId("atlas")).not.toBeInTheDocument();

    await act(async () => {
      pending?.({ didTimeout: false, timeRemaining: () => 50 });
    });

    expect(await screen.findByTestId("atlas")).toHaveTextContent("en");
    expect(document.querySelector(".atlas-stage--loading")).not.toBeInTheDocument();
  });
});
