import dynamic from "next/dynamic";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Emphasize } from "@/components/Emphasize";
import { careerBreak, contact, copy, education, experience, languages, skills } from "@/data/copy";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { featured, type Project } from "@/data/projects";
import type { AuditSnapshot } from "@/lib/audit";
import { RECRUITER_SKILLS, RECRUITER_TOKENS } from "@/lib/emphasize";
import { mailTo } from "@/lib/mail";
import { ButtonArrow } from "@/components/ButtonArrow";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { TechnologyChips } from "@/components/TechnologyChips";
import { linkLabel } from "@/lib/labels";
import { CV_FILENAME, CV_PATH, SITE_HOST, SITE_NAME, SITE_REPO } from "@/lib/site";
import { SUPPORT_PATH } from "@/lib/support";
import { SpotlightLayer } from "@/components/SpotlightLayer";
import { SignalBoard, type SignalStrings } from "@/components/SignalBoard";
import { WordAtlasLazy } from "@/components/WordAtlasLazy";

const GitHubActivity = dynamic(
  () => import("@/components/GitHubActivity").then((mod) => mod.GitHubActivity),
  {
    loading: () => (
      <section id="github" className="section activity-skeleton" aria-busy="true">
        <div className="skeleton-block" />
      </section>
    ),
  },
);


function projectLinks(project: Project, locale: Locale) {
  const t = copy[locale];
  return (
    <div className="links">
      {project.live ? (
        <a
          className="primary"
          href={project.live}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={linkLabel(t.liveFor, project.name)}
        >
          {t.viewLive}
          <ButtonArrow out />
        </a>
      ) : null}
      {project.href ? (
        <Link
          className="primary"
          href={withLocale(locale, project.href)}
          aria-label={linkLabel(t.liveFor, project.name)}
        >
          {t.viewLive}
          <ButtonArrow />
        </Link>
      ) : null}
      {project.caseStudy ? (
        <Link
          href={withLocale(locale, `/work/${project.caseStudy}`)}
          aria-label={linkLabel(t.caseStudyFor, project.name)}
        >
          {t.caseStudy}
          <ButtonArrow />
        </Link>
      ) : null}
      {project.repo && !project.private ? (
        <a
          href={project.repo}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={linkLabel(t.sourceFor, project.name)}
        >
          {t.source}
          <ButtonArrow out />
        </a>
      ) : null}
    </div>
  );
}

function HeartIcon() {
  return (
    <svg className="heart" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.2 4.5 6 4.5c2.2 0 3.6 1.2 4.5 2.6.3.5.7.5 1 0 .9-1.4 2.3-2.6 4.5-2.6 3.8 0 5.6 3.9 4 7.2C19.5 16.4 12 21 12 21Z"
      />
    </svg>
  );
}

/** Inline HUD icons for the hero legend strip — called from Desk JSX (~197–211). */
function StripIcon({ kind }: { kind: "projects" | "signal" | "work" | "hire" }) {
  const common = {
    className: "strip-icon",
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    focusable: false as const,
  };
  if (kind === "projects") {
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (kind === "signal") {
    return (
      <svg {...common}>
        <path d="M4 12h2.5l2-5 3 10 2.5-6H20" />
      </svg>
    );
  }
  if (kind === "work") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h10" />
        <circle cx="18.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m5 8 7 5 7-5" />
    </svg>
  );
}

function ProofLine({ text }: { text: string }) {
  // Every token in the proof line is a curated recruiter keyword, so all of them
  // are emphasised. (The old English-only `token === "Barcelona"` check left the
  // Italian "Barcellona" unbolded.)
  return (
    <p className="proof-line">
      {text.split(" · ").map((token, index) => (
        <span key={token}>
          {index > 0 ? " · " : null}
          <strong className="hit">{token}</strong>
        </span>
      ))}
    </p>
  );
}

export function Desk({
  audit,
  initialLocale,
}: {
  audit: AuditSnapshot;
  initialLocale: Locale;
}) {
  const locale = initialLocale;
  const t = copy[locale];
  const hits = t.hits;
  const tokens = [...hits, ...RECRUITER_TOKENS];
  const spotlight = featured.filter((item) => item.spotlight);
  const restWork = featured.filter((item) => !item.spotlight);

  const signalStrings: SignalStrings = {
    signalTitle: t.signalTitle,
    signalLede: t.signalLede,
    auditTitle: t.auditTitle,
    auditBody: t.auditBody,
    auditClean: t.auditClean,
    auditHot: t.auditHot,
    obsTitle: t.obsTitle,
    vitalsTitle: t.vitalsTitle,
    vitalGood: t.vitalGood,
    vitalDefs: t.vitalDefs,
    healthLine: t.healthLine,
    healthWaiting: t.healthWaiting,
    controls: t.controls,
  };

  return (
    <SpotlightLayer>
      <a className="skip" href="#main">
        {t.skipToContent}
      </a>
      <div className="wrap">
        <header className="top">
          <a className="brand" href="#intro">
            <BrandMark />
            {SITE_NAME}
          </a>
          <nav className="nav" aria-label={t.navLabel}>
            <a href="#projects">{t.projectsTitle}</a>
            <a href="#work">{t.workTitle}</a>
            <a href="#contact">{t.contactTitle}</a>
            <Link href={withLocale(locale, "/ask")}>{t.askNav}</Link>
            <a
              href={SITE_REPO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={linkLabel(t.sourceFor, SITE_HOST)}
            >
              {t.source}
            </a>
            {/* Plain <a>, like the footer link: <Link> would prefetch /donate and fire the redirect on every view. */}
            <a className="nav-support" href={SUPPORT_PATH}>
              <HeartIcon />
              {t.supportLink}
            </a>
            <span className="hud-pill" aria-hidden="true">
              <span className="signal-pip" />
              {t.atlasLive}
            </span>
            <a className="nav-hire" href={mailTo(t.hireSubject)}>
              {t.hireCta}
            </a>
            <LanguageSwitcher locale={locale} langLabel={t.lang} />
            <ThemeSwitcher label={t.theme} names={t.themeNames} />
          </nav>
        </header>

        <main id="main" className="sheet" tabIndex={-1}>
          <section id="intro" className="hero atlas-hero">
            <div className="atlas-hero-intro">
              <p className="atlas-pending">{t.pendingRibbon}</p>
              <div className="atlas-hero-title">
                <h1>{SITE_NAME}</h1>
                <p className="role">{t.headline}</p>
                <p className="seeking">{t.seeking}</p>
                <p className="tagline">{t.tagline}</p>
              </div>
            </div>
            <div className="atlas-hero-stage">
              <WordAtlasLazy locale={locale} variant="hero" />
            </div>
            <nav className="atlas-legend-strip" aria-label={t.legendLabel}>
              <a href="#projects">
                <StripIcon kind="projects" />
                <span className="strip-label">{t.projectsTitle}</span>
              </a>
              <a href="#signal">
                <StripIcon kind="signal" />
                <span className="strip-label">{t.signalTitle}</span>
              </a>
              <a href="#work">
                <StripIcon kind="work" />
                <span className="strip-label">{t.workTitle}</span>
              </a>
              <a href={mailTo(t.hireSubject)}>
                <StripIcon kind="hire" />
                <span className="strip-label">{t.hireCta}</span>
              </a>
            </nav>
            <div className="atlas-hero-proof">
              <div className="meta-row">
                <span className="hit">{t.place}</span>
                <span className="hit">{t.now}</span>
                <span className="hit">{t.kicker}</span>
              </div>
              <p className="lede">
                <Emphasize text={t.lede} phrases={hits} />
              </p>
              <p className="proof-metric">{t.proofMetric}</p>
              <ProofLine text={t.proofLine} />
              <div className="cta-row">
                <a className="cta ghost" href={mailTo(t.buildSubject)}>
                  {t.buildCta}
                </a>
                {/* The real CV file, straight to disk. Not the /print route, which builds a PDF from page markup. */}
                <a className="cta ghost" href={CV_PATH} download={CV_FILENAME}>
                  {t.cvCta}
                </a>
              </div>
              <a className="hero-email" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
            </div>
          </section>

          <section id="projects" className="section reveal">
            <h2>{t.projectsTitle}</h2>
            <div className="grid-cards">
              {spotlight.map((project) => (
                <article className="card project-card" key={project.name}>
                  <div className="card-status">
                    <span className={project.live ? "badge live" : project.private ? "badge private" : "badge"}>
                      {project.live ? t.live : project.private ? t.private : t.public}
                    </span>
                    {project.live && project.private ? <span className="badge private">{t.private}</span> : null}
                  </div>
                  <h3>{project.name}</h3>
                  <p>{project.blurb[locale]}</p>
                  <TechnologyChips items={project.stack} />
                  {projectLinks(project, locale)}
                </article>
              ))}
            </div>
            {restWork.length > 0 ? (
              <div className="rest-work">
                {restWork.map((project) => (
                  <div className="repo-row" key={project.name}>
                    <div>
                      <strong>{project.name}</strong>
                      {project.private ? <span className="badge private repo-badge">{t.private}</span> : null}
                      <div className="muted">{project.blurb[locale]}</div>
                    </div>
                    {projectLinks(project, locale)}
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section id="work" className="section reveal">
            <h2>{t.workTitle}</h2>
            <div className="trace">
              <article className="job job-now">
                <div>
                  <div className="org">{t.breakTitle}</div>
                  <div className="when">{careerBreak[locale].when}</div>
                </div>
                <p>
                  <Emphasize text={careerBreak[locale].body} phrases={tokens} />
                </p>
              </article>
              {experience[locale].map((job) => (
                <article className="job" key={job.org + job.when}>
                  <div>
                    <div className="org">{job.org}</div>
                    <div className="title">{job.title}</div>
                    <div className="when">{job.when}</div>
                  </div>
                  <div>
                    <p>
                      <Emphasize text={job.body} phrases={tokens} />
                    </p>
                    <ul className="job-points">
                      {job.points.map((point) => (
                        <li key={point}>
                          <Emphasize text={point} phrases={tokens} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="skills" className="section reveal">
            <h2>{t.skillsTitle}</h2>
            <div className="skill-groups">
              {(Object.keys(skills) as Array<keyof typeof skills>).map((group) => (
                <div key={group}>
                  <h3 className="skill-label">{t.skillGroups[group]}</h3>
                  <TechnologyChips items={skills[group]} highlighted={RECRUITER_SKILLS} />
                </div>
              ))}
            </div>
          </section>

          <section id="contact" className="section reveal">
            <h2>{t.contactTitle}</h2>
            <p className="lede">
              <Emphasize text={t.contactLede} phrases={hits} />
            </p>
            <div className="path-grid">
              <article className="card path-card">
                <div className="path-label">{t.hirePath}</div>
                <h3>{t.hireCta}</h3>
                <p>
                  <Emphasize text={t.hirePathLede} phrases={hits} />
                </p>
                <a className="cta" href={mailTo(t.hireSubject)}>
                  {t.hireCta}
                </a>
              </article>
              <article className="card path-card">
                <div className="path-label">{t.buildPath}</div>
                <h3>{t.buildCta}</h3>
                <p>{t.buildPathLede}</p>
                <a className="cta ghost" href={mailTo(t.buildSubject)}>
                  {t.buildCta}
                </a>
              </article>
              <article className="card path-card">
                <div className="path-label">{t.supportPath}</div>
                <h3>{t.supportNav}</h3>
                <p>{t.supportPathLede}</p>
                <a className="cta ghost" href={SUPPORT_PATH}>
                  {t.supportLink}
                </a>
              </article>
            </div>
            <div className="contact-panel">
              <div className="path-label">{t.writeCta}</div>
              <a className="contact-email" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
              <div className="contact">
                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                  <ButtonArrow out />
                </a>
                <a href={contact.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                  <ButtonArrow out />
                </a>
              </div>
            </div>
          </section>

          <GitHubActivity locale={locale} strings={t.activity} />

          <section id="signal" className="section reveal">
            <h2>{t.signalTitle}</h2>
            <SignalBoard audit={audit} strings={signalStrings} showHeading={false} />
          </section>

          <section id="edu" className="section reveal">
            <h2>{t.eduTitle}</h2>
            {education[locale].map((item) => (
              <p className="edu-line" key={item}>
                {item}
              </p>
            ))}
            <h3 className="subhead">{t.langsTitle}</h3>
            <p>{languages[locale]}</p>
          </section>
        </main>

        <footer>
          <span>{t.footer}</span>
          {" · "}
          <Link href={withLocale(locale, "/cv")}>{t.cvTitle}</Link>
          {" · "}
          <Link href={withLocale(locale, "/privacy")}>{t.privacyLink}</Link>
          {" · "}
          {/* A plain <a>: <Link> would prefetch /donate, i.e. fire the redirect on every view. */}
          <a href={SUPPORT_PATH}>{t.supportLink}</a>
          {" · "}
          <a
            href={SITE_REPO}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={linkLabel(t.sourceFor, SITE_HOST)}
          >
            {t.source}
          </a>
        </footer>
      </div>
    </SpotlightLayer>
  );
}
