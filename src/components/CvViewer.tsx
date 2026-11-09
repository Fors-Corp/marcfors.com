import { CvPdfEmbed } from "@/components/CvPdfEmbed";
import { copy } from "@/data/copy";
import { cvPdfEmbedSrc } from "@/lib/cvPdfFit";
import type { Locale } from "@/lib/locale";
import { CV_DOWNLOAD_HASH, CV_FILENAME, CV_PATH } from "@/lib/site";

/**
 * Renders the designed CV PDF inline and offers it for download.
 *
 * The visible embed is a client canvas (pdf.js) scaled to the container width
 * so mobile Safari cannot open the file at an oversized native zoom. Download
 * and Open stay plain links. A <noscript> iframe with `#view=FitH` covers the
 * no-JS path; CSP still keeps `object-src 'none'`, so that fallback is an
 * iframe (the PDF is served with `frame-ancestors 'self'`).
 *
 * The download control keeps id={CV_DOWNLOAD_HASH} so Ask CV citations can
 * deep-link here (`/cv#cv-download`) and scroll/focus the affordance.
 */
export function CvViewer({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const fitSrc = cvPdfEmbedSrc(CV_PATH);
  return (
    <div className="cv">
      <div className="cta-row">
        <a id={CV_DOWNLOAD_HASH} className="cta" href={CV_PATH} download={CV_FILENAME}>
          {t.cvDownload}
        </a>
        <a className="cta ghost" href={fitSrc} target="_blank" rel="noopener noreferrer">
          {t.cvOpen}
        </a>
      </div>
      <CvPdfEmbed title={t.cvViewerLabel} />
      <noscript>
        <iframe className="cv-frame" src={fitSrc} title={t.cvViewerLabel} />
      </noscript>
      <p className="muted cv-hint">{t.cvUnsupported}</p>
    </div>
  );
}
