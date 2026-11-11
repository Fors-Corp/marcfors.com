import { describe, expect, it } from "vitest";
import { askFabViewportInsets } from "@/lib/askFabViewport";

describe("askFabViewportInsets", () => {
  it("reports no bottom inset when the visual viewport fills the layout", () => {
    expect(
      askFabViewportInsets({ height: 844, offsetTop: 0 }, 844),
    ).toEqual({ bottom: 0, height: 844 });
  });

  it("lifts the fab by the occluded bottom when the keyboard shrinks the viewport", () => {
    // iPhone-ish: layout 844, keyboard leaves ~400px visible, offsetTop 0.
    expect(
      askFabViewportInsets({ height: 400, offsetTop: 0 }, 844),
    ).toEqual({ bottom: 444, height: 400 });
  });

  it("accounts for visualViewport.offsetTop when Safari scrolls the layout", () => {
    expect(
      askFabViewportInsets({ height: 390, offsetTop: 80 }, 844),
    ).toEqual({ bottom: 374, height: 390 });
  });

  it("never returns a negative inset or height", () => {
    expect(
      askFabViewportInsets({ height: 900, offsetTop: 0 }, 800),
    ).toEqual({ bottom: 0, height: 900 });
  });
});
