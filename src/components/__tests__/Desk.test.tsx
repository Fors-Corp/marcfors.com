import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Desk } from "@/components/Desk";
import { copy } from "@/data/copy";
import { featured } from "@/data/projects";
import { getAuditSnapshot } from "@/lib/audit";
import { CV_FILENAME, CV_PATH } from "@/lib/site";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("web-vitals", () => ({
  onLCP: vi.fn(),
  onINP: vi.fn(),
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

const audit = getAuditSnapshot();
const renderDesk = (locale: "en" | "it" = "en") =>
  render(<Desk repos={[]} audit={audit} initialLocale={locale} />);

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ ok: true, audit }) }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Desk", () => {
  it("leads with the name and role", () => {
    renderDesk();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Marc Fors");
    expect(screen.getByText(copy.en.headline)).toBeInTheDocument();
  });

  it("renders every section, all visible on load — no accordion", () => {
    const { container } = renderDesk();
    for (const id of ["intro", "projects", "work", "skills", "contact", "signal", "edu"]) {
      const section = container.querySelector(`#${id}`);
      expect(section, id).toBeTruthy();
      expect(section, id).toBeVisible();
    }
    // The section headings are plain h2s, not expand/collapse buttons.
    expect(container.querySelector(".fold-head")).toBeNull();
    expect(container.querySelector("[aria-expanded]")).toBeNull();
    for (const label of [copy.en.projectsTitle, copy.en.workTitle, copy.en.contactTitle]) {
      expect(screen.getByRole("heading", { level: 2, name: label })).toBeInTheDocument();
    }
  });

  it("keeps only the archive collapsed, and it opens on click", async () => {
    const { container } = renderDesk();
    const archive = container.querySelector("details#more") as HTMLDetailsElement;
    expect(archive).toBeTruthy();
    expect(archive.open).toBe(false);
    await userEvent.click(within(archive).getByText(copy.en.atticTitle));
    expect(archive.open).toBe(true);
  });

  it("downloads the real CV file from the home page and offers no generated PDF", () => {
    renderDesk();
    const download = screen.getByRole("link", { name: copy.en.cvCta });
    // A direct file download, not a link to a page that builds one.
    expect(download).toHaveAttribute("href", CV_PATH);
    expect(download).toHaveAttribute("download", CV_FILENAME);

    // /print produces a PDF from page markup via window.print(); it must not be
    // reachable from the home page, hero or footer.
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.filter((href) => href.endsWith("/print"))).toEqual([]);
  });

  it("links the footer to the CV viewer page", () => {
    renderDesk("it");
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: copy.it.cvTitle })).toHaveAttribute(
      "href",
      "/it/cv",
    );
  });

  it("never shows a source link for a private project", () => {
    renderDesk();
    const privateProject = featured.find((p) => p.private && !p.repo);
    expect(privateProject).toBeTruthy();
    const heading = screen.getByRole("heading", { name: privateProject!.name });
    const card = heading.closest(".card") as HTMLElement;
    expect(within(card).getByText(copy.en.private)).toBeInTheDocument();
    expect(within(card).queryByRole("link", { name: copy.en.source })).toBeNull();
  });

  it("emphasises every proof-line token, including the Italian 'Barcellona'", () => {
    const { container } = renderDesk("it");
    const proof = container.querySelector(".proof-line") as HTMLElement;
    const tokens = copy.it.proofLine.split(" · ");
    const bolded = [...proof.querySelectorAll("strong.hit")].map((el) => el.textContent);
    expect(bolded).toEqual(tokens);
    expect(bolded).toContain("Barcellona");
  });

  // WCAG 2.4.9 — the desk repeats SOURCE / LIVE / CASE STUDY once per project,
  // so before the aria-labels landed seven "Source" links shared one accessible
  // name across four different repos. axe reports this as `incomplete` rather
  // than a violation (it cannot know whether same-name links are same-purpose),
  // so the blanket axe scan below would not have caught it. This pins the actual
  // invariant instead: same accessible name implies same destination.
  it("gives every same-named link the same destination", () => {
    const { container } = renderDesk();
    const byName = new Map<string, Set<string>>();
    for (const link of container.querySelectorAll<HTMLAnchorElement>("a[href]")) {
      const name = (link.getAttribute("aria-label") ?? link.textContent ?? "").trim().toLowerCase();
      if (!name) continue;
      const dest = byName.get(name) ?? new Set<string>();
      dest.add(link.getAttribute("href") as string);
      byName.set(name, dest);
    }
    const collisions = [...byName.entries()]
      .filter(([, dests]) => dests.size > 1)
      .map(([name, dests]) => `"${name}" -> ${[...dests].join(", ")}`);
    expect(collisions).toEqual([]);
  });

  it(
    "has no axe violations",
    async () => {
      const { container } = renderDesk();
      expect(await axe(container)).toHaveNoViolations();
    },
    15000, // a full-desk axe scan under coverage instrumentation can outrun the 5s default
  );
});
