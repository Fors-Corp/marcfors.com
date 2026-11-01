import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { SignalRail } from "@/components/SignalRail";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});
afterEach(() => {
  document.documentElement.style.removeProperty("--desk-progress");
  vi.restoreAllMocks();
});

describe("SignalRail", () => {
  it("fills the rail under reduced motion and exposes an inert progress element", () => {
    const { container } = render(<SignalRail />);
    const rail = container.querySelector(".signal-rail");
    expect(rail).toHaveAttribute("aria-hidden", "true");
    expect(document.documentElement.style.getPropertyValue("--desk-progress")).toBe("1");
  });
});
