import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CvViewer } from "@/components/CvViewer";
import { copy } from "@/data/copy";
import { cvPdfEmbedSrc } from "@/lib/cvPdfFit";
import { LOCALES } from "@/lib/locale";
import { CV_DOWNLOAD_HASH, CV_FILENAME, CV_PATH } from "@/lib/site";

// Keep pdf.js out of jsdom; page-width math is covered in cvPdfFit.test.ts and
// the canvas paint path needs real layout and a worker.
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: () => ({
    promise: new Promise(() => {
      /* never settles in unit tests */
    }),
  }),
}));

// next/dynamic is async in tests; render the real embed shell immediately so
// assertions can see the titled canvas region without waiting on a chunk load.
vi.mock("@/components/CvPdfEmbedLazy", async () => {
  const { CvPdfEmbed } = await import("@/components/CvPdfEmbed");
  return { CvPdfEmbedLazy: CvPdfEmbed };
});

describe("CvViewer", () => {
  it("offers the PDF as a download with a named file", () => {
    render(<CvViewer locale="en" />);
    const download = screen.getByRole("link", { name: copy.en.cvDownload });
    expect(download).toHaveAttribute("href", CV_PATH);
    // Without `download` the browser navigates to the PDF instead of saving it.
    expect(download).toHaveAttribute("download", CV_FILENAME);
    // Ask CV citations deep-link here via /cv#cv-download.
    expect(download).toHaveAttribute("id", CV_DOWNLOAD_HASH);
  });

  it("opens the PDF in a new tab without handing it window.opener", () => {
    render(<CvViewer locale="en" />);
    const open = screen.getByRole("link", { name: copy.en.cvOpen });
    // FitH helps Chromium/Firefox when the user leaves the in-page canvas.
    expect(open).toHaveAttribute("href", cvPdfEmbedSrc(CV_PATH));
    expect(open).toHaveAttribute("target", "_blank");
    expect(open).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("embeds the PDF in a titled, keyboard-focusable page-width region, not an iframe", async () => {
    const user = userEvent.setup();
    render(<CvViewer locale="en" />);
    // role=region + tabindex=0: axe scrollable-region-focusable; role=img blocked
    // keyboard PageDown/arrows even when focused. onKeyDown scrolls explicitly
    // because Chromium often ignores Arrow/Page on overflow regions.
    const frame = screen.getByRole("region", { name: copy.en.cvViewerLabel });
    expect(frame.tagName).toBe("DIV");
    expect(frame).toHaveClass("cv-frame--canvas");
    expect(frame).toHaveAttribute("tabindex", "0");
    expect(frame.querySelector(".cv-pages")).not.toBeNull();
    // Native PDF chrome used to live here as an <iframe src={CV_PATH}>; that
    // path zoomed past the phone width. Keep it out of the JS tree.
    expect(document.querySelector("iframe.cv-frame")).toBeNull();

    Object.defineProperty(frame, "clientHeight", { configurable: true, value: 200 });
    Object.defineProperty(frame, "scrollHeight", { configurable: true, value: 800 });
    let scrollTop = 0;
    Object.defineProperty(frame, "scrollTop", {
      configurable: true,
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
    });
    frame.focus();
    await user.keyboard("{PageDown}");
    expect(scrollTop).toBeGreaterThan(0);
  });

  it("focuses the download control when the URL hash targets it", async () => {
    window.location.hash = `#${CV_DOWNLOAD_HASH}`;
    render(<CvViewer locale="en" />);
    await waitFor(() => {
      expect(screen.getByRole("link", { name: copy.en.cvDownload })).toHaveFocus();
    });
    window.location.hash = "";
  });

  it("keeps a visible way out when the browser will not render inline", () => {
    render(<CvViewer locale="en" />);
    expect(screen.getByText(copy.en.cvUnsupported)).toBeInTheDocument();
  });

  it("renders in every locale from that locale's copy", () => {
    for (const locale of LOCALES) {
      const { unmount } = render(<CvViewer locale={locale} />);
      expect(screen.getByRole("link", { name: copy[locale].cvDownload })).toBeInTheDocument();
      expect(screen.getByRole("region", { name: copy[locale].cvViewerLabel })).toBeInTheDocument();
      unmount();
    }
  });
});
