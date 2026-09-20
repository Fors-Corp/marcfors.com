import { copy } from "@/data/copy";
import type { Locale } from "@/lib/locale";
import { CV_FILENAME, CV_PATH } from "@/lib/site";

/**
 * Renders the designed CV PDF inline and offers it for download.
 *
 * Plain HTML on purpose — an <a download> and an <iframe> need no client
 * JavaScript, so this stays a server component and adds nothing to the bundle.
 *
 * It has to be an <iframe>: the CSP keeps `object-src 'none'`, which rules out
 * <object>/<embed>. The PDF is served with `frame-ancestors 'self'` (see
 * EMBEDDABLE_ASSET_HEADERS) so this same-origin frame is allowed while every
 * cross-origin framer is still refused.
 *
 * Browsers without an inline PDF viewer (most mobile ones) paint an empty
 * frame rather than falling back to the element's children, so the two buttons
 * above it and the hint below are the real fallback path.
 */
export function CvViewer({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <div className="cv">
      <div className="cta-row">
        <a className="cta" href={CV_PATH} download={CV_FILENAME}>
          {t.cvDownload}
        </a>
        <a className="cta ghost" href={CV_PATH} target="_blank" rel="noopener noreferrer">
          {t.cvOpen}
        </a>
      </div>
      <iframe className="cv-frame" src={CV_PATH} title={t.cvViewerLabel} />
      <p className="muted cv-hint">{t.cvUnsupported}</p>
    </div>
  );
}
