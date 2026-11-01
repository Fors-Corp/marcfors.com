import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "./not-found";

describe("not found", () => {
  it("tells crawlers to skip a missing page", () => {
    render(<NotFound />);
    // React 19 hoists <meta> and <title> out of the rendered <html> into document.head.
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    expect(document.title).toBe("Page not found — Marc Fors");
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});
