import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Desk } from "@/components/Desk";
import { copy, skills } from "@/data/copy";
import { featured } from "@/data/projects";
import { getAuditSnapshot } from "@/lib/audit";
import { LOCALES, type Locale } from "@/lib/locale";
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
const renderDesk = (locale: Locale = "en") =>
  render(<Desk repos={[]} audit={audit} initialLocale={locale} />);

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect() {}
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ ok: true, audit }) }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Desk", () => {
  it.each(LOCALES)("pairs every project and skill label with a decorative icon (%s)", (locale) => {
    const { container } = renderDesk(locale);
    for (const card of container.querySelectorAll(".project-card")) {
      const chips = card.querySelectorAll(".chips li");
      expect(chips.length).toBeGreaterThan(0);
      for (const chip of chips) expect(chip.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }
    const stack = container.querySelector("#skills") as HTMLElement;
    expect(within(stack).getAllByRole("heading", { level: 3 })).toHaveLength(Object.keys(skills).length);
    expect(stack.querySelectorAll(".technology-icon")).toHaveLength(Object.values(skills).flat().length);
  });

  it("leads with the name and role", () => {
    renderDesk();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Marc Fors");
    expect(screen.getByText(copy.en.headline)).toBeInTheDocument();
  });

  it("puts Mensura first in featured work and links its detailed case study", () => {
    renderDesk();
    const firstCard = document.querySelector("#projects .project-card");
    expect(firstCard).toBeTruthy();
    expect(within(firstCard as HTMLElement).getByRole("heading", { name: "Mensura" })).toBeInTheDocument();
    expect(within(firstCard as HTMLElement).getByRole("link", { name: /case study for mensura/i })).toHaveAttribute(
      "href",
      "/work/mensura",
    );
  });

  it("features Wordkeep second, opening the live app and its case study", () => {
    renderDesk();
    const secondCard = document.querySelectorAll("#projects .project-card")[1] as HTMLElement;
    expect(within(secondCard).getByRole("heading", { name: "Wordkeep" })).toBeInTheDocument();
    expect(within(secondCard).getByRole("link", { name: /view live: wordkeep/i })).toHaveAttribute(
      "href",
      "https://wordkeep.me",
    );
    expect(within(secondCard).getByRole("link", { name: /case study for wordkeep/i })).toHaveAttribute(
      "href",
      "/work/wordkeep",
    );
  });

  it.each(LOCALES)("renders project actions as buttons, the live product filled and labelled as an action (%s)", (locale) => {
    const { container } = renderDesk(locale);
    const t = copy[locale];
    for (const card of container.querySelectorAll<HTMLElement>(".project-card")) {
      const actions = card.querySelector(".links") as HTMLElement;
      const live = actions.querySelector<HTMLAnchorElement>("a.primary");
      if (live) {
        expect(live).toHaveTextContent(t.viewLive);
        expect(actions.firstElementChild).toBe(live);
      }
      for (const link of actions.querySelectorAll("a")) {
        expect(link.querySelector(".btn-arrow")).toHaveAttribute("aria-hidden", "true");
      }
      // The privacy of the source is status, shown beside "Live", never mixed into the actions.
      expect(actions.querySelector(".badge")).toBeNull();
    }
  });

  it("keeps the private tag on archived rest-of-work rows", () => {
    const { container } = renderDesk();
    const row = [...container.querySelectorAll<HTMLElement>(".rest-work .repo-row")].find((el) =>
      el.textContent?.includes("GH Dashboard"),
    );
    expect(row?.querySelector(".badge.private")).toHaveTextContent(copy.en.private);
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

  it("links the footer to the privacy notice", () => {
    renderDesk("it");
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: copy.it.privacyLink })).toHaveAttribute(
      "href",
      "/it/privacy",
    );
  });

  it("links the footer to the support hub as a plain same-tab link", () => {
    renderDesk("it");
    const footer = screen.getByRole("contentinfo");
    const support = within(footer).getByRole("link", { name: copy.it.supportLink });
    expect(support).toHaveAttribute("href", "/donate");
    // Same tab on purpose: Stripe's success redirect brings the visitor back to /donate/thanks.
    expect(support).not.toHaveAttribute("target");
  });

  it.each(LOCALES)("surfaces Support in the header nav and the contact section (%s)", (locale) => {
    renderDesk(locale);
    const t = copy[locale];
    const nav = screen.getByRole("navigation", { name: t.navLabel });
    const navLink = within(nav).getByRole("link", { name: t.supportNav });
    expect(navLink).toHaveAttribute("href", "/donate");
    expect(navLink).not.toHaveAttribute("target");

    const contact = document.getElementById("contact") as HTMLElement;
    const card = within(contact).getByRole("heading", { name: t.supportNav }).closest(".card") as HTMLElement;
    expect(within(card).getByText(t.supportPathLede)).toBeInTheDocument();
    const cta = within(card).getByRole("link", { name: t.supportLink });
    expect(cta).toHaveAttribute("href", "/donate");
    expect(cta).not.toHaveAttribute("target");
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

  it("shows both the source link and the private badge when a private project opts into linking its repo", () => {
    renderDesk();
    const card = screen.getByRole("heading", { name: "FerreTodo Lepant" }).closest(".card") as HTMLElement;
    expect(card.querySelector('a[href="https://github.com/marcfs31/ferretodo-lepant"]')).toHaveTextContent(copy.en.source);
    expect(within(card).getByText(copy.en.private)).toHaveClass("private");
  });

  it("distinguishes a live product's status from the privacy of its source", () => {
    renderDesk();
    const card = screen.getByRole("heading", { name: "Gatto" }).closest(".card") as HTMLElement;
    expect(within(card).getByText(copy.en.live, { selector: ".badge" })).not.toHaveClass("private");
    expect(within(card).getByText(copy.en.private)).toHaveClass("private");
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
