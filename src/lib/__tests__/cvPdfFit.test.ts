import { describe, expect, it } from "vitest";
import { CV_PDF_VIEW_HASH, cvPdfEmbedSrc, pageWidthScale } from "@/lib/cvPdfFit";
import { CV_PATH } from "@/lib/site";

describe("pageWidthScale", () => {
  it("fits the page width to the container (FitH / page-width)", () => {
    // A4-ish PDF points into a phone content column.
    expect(pageWidthScale(360, 595.28)).toBeCloseTo(360 / 595.28);
  });

  it("returns 1 when either dimension is missing", () => {
    expect(pageWidthScale(0, 595)).toBe(1);
    expect(pageWidthScale(360, 0)).toBe(1);
    expect(pageWidthScale(-10, 595)).toBe(1);
  });
});

describe("cvPdfEmbedSrc", () => {
  it("asks native PDF chrome for a horizontal fit when JS is unavailable", () => {
    expect(CV_PDF_VIEW_HASH).toBe("view=FitH");
    expect(cvPdfEmbedSrc(CV_PATH)).toBe(`${CV_PATH}#view=FitH`);
  });
});
