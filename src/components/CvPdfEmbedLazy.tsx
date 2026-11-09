"use client";

import dynamic from "next/dynamic";

/**
 * Code-split the pdf.js canvas embed off every non-/cv route. A static import
 * of `CvPdfEmbed` would still put that client module in the app graph; this
 * `next/dynamic` boundary keeps pdfjs-dist out of the homepage JS.
 */
export const CvPdfEmbedLazy = dynamic(
  () => import("@/components/CvPdfEmbed").then((mod) => mod.CvPdfEmbed),
  {
    ssr: false,
    loading: () => (
      <div className="cv-frame cv-frame--canvas" data-cv-status="loading" aria-hidden="true" />
    ),
  },
);
