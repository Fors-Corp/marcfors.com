import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AskAnswer } from "@/components/AskAnswer";

describe("AskAnswer", () => {
  it("renders bold, list items, and https links", () => {
    render(
      <AskAnswer
        text={[
          "Marc Fors is an engineer (about.md).",
          "",
          "- **Focus:** LLM agents (about.md).",
          "- Contact: [site](https://marcfors.com) (about.md).",
        ].join("\n")}
      />,
    );

    expect(screen.getByText("Focus:", { exact: false }).tagName).toBe("STRONG");
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText("Focus:")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "site" });
    expect(link).toHaveAttribute("href", "https://marcfors.com");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    const cites = screen.getAllByRole("link", { name: "about.md" });
    expect(cites.length).toBeGreaterThan(0);
    expect(cites[0]).toHaveAttribute("href", "/#intro");
  });

  it("highlights bare https links and corpus citations", () => {
    render(
      <AskAnswer text="Portfolio: https://marcfors.com. See work/mensura.md." />,
    );
    expect(screen.getByRole("link", { name: "https://marcfors.com" })).toHaveAttribute(
      "href",
      "https://marcfors.com",
    );
    const source = screen.getByRole("link", { name: "work/mensura.md" });
    expect(source).toHaveAttribute("href", "/work/mensura");
    expect(source).toHaveClass("ask-source");
  });

  it("notifies when a source link is opened", async () => {
    const user = userEvent.setup();
    const onSourceNavigate = vi.fn();
    render(<AskAnswer text="See experience.md." onSourceNavigate={onSourceNavigate} />);
    await user.click(screen.getByRole("link", { name: "experience.md" }));
    expect(onSourceNavigate).toHaveBeenCalledOnce();
  });

  it("does not interpret raw HTML", () => {
    const { container } = render(
      <AskAnswer text={'Hello <script>alert(1)</script> **there**'} />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText(/Hello <script>alert\(1\)<\/script>/)).toBeInTheDocument();
    expect(screen.getByText("there").tagName).toBe("STRONG");
  });
});
