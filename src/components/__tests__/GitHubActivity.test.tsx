import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { GitHubActivity } from "@/components/GitHubActivity";
import { copy } from "@/data/copy";
import type { ActivitySnapshot } from "@/lib/githubActivity";

const t = copy.en.activity;
const snapshot: ActivitySnapshot = {
  checkedAt: "2026-10-16T12:00:00Z",
  events: [{
    id: "123", kind: "push", repo: "Fors-Corp/marcfors.com",
    url: "https://github.com/Fors-Corp/marcfors.com/commits",
    date: "2026-10-16T10:00:00Z",
  }],
  calendar: [
    { date: "2026-10-15", count: 12, level: 3 },
    { date: "2026-10-16", count: 2, level: 1 },
  ],
};
let intersect: (entries: { isIntersecting: boolean }[]) => void;
const disconnect = vi.fn();
const enter = async () => act(async () => intersect([{ isIntersecting: true }]));

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: typeof intersect) { intersect = callback; }
    observe() {}
    disconnect = disconnect;
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(snapshot)));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  disconnect.mockClear();
});

describe("GitHub activity", () => {
  it("waits until near the viewport and only fetches the first-party endpoint", async () => {
    render(<GitHubActivity locale="en" strings={t} />);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(t.loading);
    expect(screen.getByRole("link", { name: /View GitHub profile/ })).toHaveAttribute("href", "https://github.com/marcfs31");
    await enter();
    expect(fetch).toHaveBeenCalledWith("/api/github-activity", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(screen.getByRole("img")).toHaveAccessibleName(/14 contributions/);
    expect(screen.getByText("Code pushed")).toBeVisible();
    expect(screen.getByRole("link", { name: "Fors-Corp/marcfors.com" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("provides dates/counts without relying on color or hundreds of keyboard stops", async () => {
    const { container } = render(<GitHubActivity locale="en" strings={t} />);
    await enter();
    expect(container.querySelectorAll("svg rect")).toHaveLength(2);
    expect(screen.queryByText("12 contributions")).not.toBeInTheDocument();
    const details = container.querySelector("details")!;
    details.open = true;
    fireEvent(details, new Event("toggle"));
    expect(await screen.findByText("12 contributions")).toBeVisible();
    expect(container.querySelectorAll("rect[tabindex]")).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows an explicit error while keeping the profile link and any healthy section", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...snapshot, calendar: null })));
    render(<GitHubActivity locale="en" strings={t} />);
    await enter();
    expect(screen.getByRole("status")).toHaveTextContent(t.unavailable);
    expect(screen.getByText("Fors-Corp/marcfors.com")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it.each(["network", "http"])("handles a %s failure without claiming zero contributions", async (failure) => {
    vi.stubGlobal("fetch", failure === "http"
      ? vi.fn().mockResolvedValue(new Response("", { status: 503 }))
      : vi.fn().mockRejectedValue(new Error("offline")));
    render(<GitHubActivity locale="en" strings={t} />);
    await enter();
    expect(screen.getByRole("status")).toHaveTextContent(t.unavailable);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("distinguishes a genuinely empty public feed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...snapshot, events: [] })));
    render(<GitHubActivity locale="en" strings={t} />);
    await enter();
    expect(screen.getByText(t.empty)).toBeVisible();
    expect(screen.getByRole("status")).not.toHaveTextContent(t.unavailable);
  });

  it("refreshes while visible, pauses offscreen and in hidden tabs, then resumes", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => Response.json(snapshot)));
    render(<GitHubActivity locale="en" strings={t} />);
    await enter();
    await act(async () => { vi.advanceTimersByTime(300_000); });
    expect(fetch).toHaveBeenCalledTimes(2);
    act(() => intersect([{ isIntersecting: false }]));
    await act(async () => { vi.advanceTimersByTime(300_000); });
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    await enter();
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("aborts pending work and disconnects on unmount", async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url, options) => {
      signal = options.signal;
      return new Promise(() => {});
    }));
    const { unmount } = render(<GitHubActivity locale="de" strings={copy.de.activity} />);
    await enter();
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(signal?.aborted).toBe(true);
  });

  it("retains the last good snapshot if a subsequent refresh fails", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json(snapshot)).mockRejectedValue(new Error("offline")));
    render(<GitHubActivity locale="en" strings={t} />);
    await enter();
    await act(async () => { vi.advanceTimersByTime(300_000); });
    expect(screen.getByRole("status")).toHaveTextContent(t.unavailable);
    expect(screen.getByRole("img")).toHaveAccessibleName(/14 contributions/);
  });
});
