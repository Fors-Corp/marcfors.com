import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { siNextdotjs, siReact } from "simple-icons";
import { TechnologyChips } from "@/components/TechnologyChips";
import { skills } from "@/data/copy/shared";
import { featured } from "@/data/projects";
import { caseStudyBySlug, listCaseStudySlugs } from "@/data/caseStudies";

describe("TechnologyChips", () => {
  it("keeps each technology name readable and hides decorative icons from assistive technology", async () => {
    const items = [...new Set([
      ...Object.values(skills).flat(),
      ...featured.flatMap((project) => project.stack),
      ...listCaseStudySlugs().flatMap((slug) => caseStudyBySlug(slug, "en")!.stack),
    ])];
    const { container } = render(<TechnologyChips items={items} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(items.length);
    for (const item of screen.getAllByRole("listitem")) {
      expect(item.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
      expect(item.querySelector("svg")).toHaveAttribute("focusable", "false");
      expect(item.querySelector("svg")).toHaveAttribute("width", "16");
      const icon = item.querySelector("use, path");
      expect(icon?.getAttribute("href") ?? icon?.getAttribute("d")).toBeTruthy();
      expect(item.querySelector(".chip")).toHaveAttribute("translate", "no");
    }
    // Assert on the chips already in hand: a getByText scan per name over this
    // SVG-heavy tree cost ~4s under coverage and put the test at its timeout.
    const chips = screen.getAllByRole("listitem").map((item) => item.querySelector(".chip"));
    expect(chips.map((chip) => chip?.textContent)).toEqual(items);
    for (const chip of chips) expect(chip).toBeVisible();
    expect(screen.queryByRole("img")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("uses the same brand icon for versioned labels without changing the displayed name", () => {
    render(<TechnologyChips items={["React 19", "Next.js 16"]} />);
    expect(screen.getByText("React 19").closest("li")?.querySelector("use")).toHaveAttribute("href", `/technology-icons.svg#${siReact.slug}`);
    expect(screen.getByText("Next.js 16").closest("li")?.querySelector("use")).toHaveAttribute("href", `/technology-icons.svg#${siNextdotjs.slug}`);
  });

  it("retains recruiter highlighting without making the chips interactive", () => {
    render(<TechnologyChips items={["React", "Jest"]} highlighted={new Set(["React"])} />);
    expect(screen.getByText("React").closest(".chip")).toHaveClass("hit");
    expect(screen.getByText("Jest").closest(".chip")).not.toHaveClass("hit");
    expect(within(screen.getByRole("list")).queryByRole("button")).toBeNull();
  });

  it("gives a future technology a neutral code symbol and preserves its full label", () => {
    render(<TechnologyChips items={["Future framework"]} />);
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("Future framework");
    expect(item.querySelector("svg")).toHaveAttribute("stroke", "currentColor");
    expect(item.querySelector("path")).toHaveAttribute("d", "m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18");
  });
});
