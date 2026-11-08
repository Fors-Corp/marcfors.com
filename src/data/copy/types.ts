export type ActivityStrings = {
  title: string;
  lede: string;
  calendar: string;
  recent: string;
  profile: string;
  loading: string;
  unavailable: string;
  empty: string;
  checked: string;
  daily: string;
  contributions: string;
  less: string;
  more: string;
  kinds: Record<"push" | "pullRequest" | "issue" | "release", string>;
};

export type UiCopy = {
  activity: ActivityStrings;
  place: string;
  now: string;
  kicker: string;
  /** HUD pill in the sticky chrome — atlas is live. */
  atlasLive: string;
  /** Wordkeep App Store status ribbon on the hero stage. */
  pendingRibbon: string;
  /** Aria label for the first-viewport legend strip. */
  legendLabel: string;
  headline: string;
  /** <title> of the home page: name first, then the role phrasings recruiters search for. */
  metaTitle: string;
  /** <meta name="description"> of the home page, ≤160 characters. */
  metaDescription: string;
  tagline: string;
  lede: string;
  proofLine: string;
  workTitle: string;
  breakTitle: string;
  projectsTitle: string;
  signalTitle: string;
  signalLede: string;
  auditTitle: string;
  auditBody: string;
  auditClean: string;
  auditHot: string;
  obsTitle: string;
  vitalsTitle: string;
  healthLine: string;
  healthWaiting: string;
  contactTitle: string;
  contactLede: string;
  hireCta: string;
  buildCta: string;
  writeCta: string;
  hirePath: string;
  buildPath: string;
  hirePathLede: string;
  buildPathLede: string;
  hireSubject: string;
  buildSubject: string;
  source: string;
  /** aria-label templates; `{project}` is filled by `linkLabel()` (WCAG 2.4.9). */
  sourceFor: string;
  liveFor: string;
  caseStudyFor: string;
  live: string;
  /** Label on the button that opens a live product; `live` stays the status badge. */
  viewLive: string;
  private: string;
  public: string;
  lang: string;
  theme: string;
  skipToContent: string;
  navLabel: string;
  seeking: string;
  proofMetric: string;
  printCta: string;
  printTitle: string;
  printHint: string;
  cvCta: string;
  cvTitle: string;
  cvLede: string;
  cvDownload: string;
  cvOpen: string;
  cvUnsupported: string;
  cvViewerLabel: string;
  caseStudy: string;
  hits: readonly string[];
  vitalGood: string;
  vitalDefs: {
    LCP: string;
    INP: string;
    CLS: string;
    FCP: string;
    TTFB: string;
  };
  eduTitle: string;
  skillsTitle: string;
  langsTitle: string;
  footer: string;
  homeCta: string;
  supportLink: string;
  /** Short header-nav label; the full "· 1,99 €" label stays on the buttons. */
  supportNav: string;
  supportPath: string;
  supportPathLede: string;
  supportThanksTitle: string;
  supportThanksBody: string;
  privacyLink: string; // footer label
  privacyTitle: string; // page <h1> and <title>
  privacyLede: string; // <meta description> and lede paragraph
  privacyUpdated: string; // "Last updated" label shown before the date
  /** Short nav / CTA label for the portfolio Ask (RAG) page. */
  askNav: string;
  askTitle: string;
  askLede: string;
  askPlaceholder: string;
  askSubmit: string;
  askBusy: string;
  askEmpty: string;
  askError: string;
  askUnavailable: string;
  askCitations: string;
  askSamplesLabel: string;
  askSamples: readonly string[];
  askSourcesLabel: string;
  askSourcesEmpty: string;
  askSourcesUnavailable: string;
  traceTitle: string;
  traceLede: string;
  tracePaste: string;
  traceSample: string;
  traceClear: string;
  traceInvalid: string;
  traceSpans: string;
  traceDuration: string;
  traceEmpty: string;
  skillGroups: {
    frontend: string;
    testing: string;
    engineering: string;
    backend: string;
  };
  themeNames: {
    system: string;
    light: string;
    dark: string;
    green: string;
    blue: string;
    red: string;
  };
  controls: {
    tls: string;
    csp: string;
    frames: string;
    cookies: string;
    audit: string;
    obs: string;
  };
};

export type Job = { org: string; title: string; when: string; body: string; points: readonly string[] };
