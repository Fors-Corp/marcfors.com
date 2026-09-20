import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CvViewer } from "@/components/CvViewer";
import { copy } from "@/data/copy";
import { LOCALES } from "@/lib/locale";
import { CV_FILENAME, CV_PATH } from "@/lib/site";

describe("CvViewer", () => {
  it("offers the PDF as a download with a named file", () => {
    render(<CvViewer locale="en" />);
    const download = screen.getByRole("link", { name: copy.en.cvDownload });
    expect(download).toHaveAttribute("href", CV_PATH);
    // Without `download` the browser navigates to the PDF instead of saving it.
    expect(download).toHaveAttribute("download", CV_FILENAME);
  });

  it("opens the PDF in a new tab without handing it window.opener", () => {
    render(<CvViewer locale="en" />);
    const open = screen.getByRole("link", { name: copy.en.cvOpen });
    expect(open).toHaveAttribute("href", CV_PATH);
    expect(open).toHaveAttribute("target", "_blank");
    expect(open).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("embeds the PDF in a titled frame so it is reachable by name", () => {
    render(<CvViewer locale="en" />);
    // getByTitle is how a screen reader finds the frame; an untitled iframe is
    // an unlabelled landmark.
    const frame = screen.getByTitle(copy.en.cvViewerLabel);
    expect(frame.tagName).toBe("IFRAME");
    expect(frame).toHaveAttribute("src", CV_PATH);
  });

  it("keeps a visible way out when the browser will not render inline", () => {
    render(<CvViewer locale="en" />);
    expect(screen.getByText(copy.en.cvUnsupported)).toBeInTheDocument();
  });

  it("renders in every locale from that locale's copy", () => {
    for (const locale of LOCALES) {
      const { unmount } = render(<CvViewer locale={locale} />);
      expect(screen.getByRole("link", { name: copy[locale].cvDownload })).toBeInTheDocument();
      expect(screen.getByTitle(copy[locale].cvViewerLabel)).toBeInTheDocument();
      unmount();
    }
  });
});
