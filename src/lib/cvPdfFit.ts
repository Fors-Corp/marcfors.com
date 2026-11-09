/**
 * Scale a PDF page so its width matches the viewer container (page-width / FitH).
 * Native browser PDF chrome (especially mobile Safari) often ignores `#view=FitH`
 * and paints at an oversized zoom; the /cv canvas viewer uses this instead.
 */
export function pageWidthScale(containerWidth: number, pageWidth: number): number {
  if (!(containerWidth > 0) || !(pageWidth > 0)) return 1;
  return containerWidth / pageWidth;
}

/** Open parameters that ask Chromium/Firefox PDF chrome for a width fit. */
export const CV_PDF_VIEW_HASH = "view=FitH";

export function cvPdfEmbedSrc(path: string): string {
  const hash = CV_PDF_VIEW_HASH.startsWith("#") ? CV_PDF_VIEW_HASH.slice(1) : CV_PDF_VIEW_HASH;
  return `${path}#${hash}`;
}
