import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Emphasize } from "@/components/Emphasize";
import { careerBreak, contact, copy, education, experience, languages, skills } from "@/data/copy";
import type { Locale } from "@/lib/locale";
import { withLocale } from "@/lib/locale";
import { featured, lab, type Project } from "@/data/projects";
import type { AuditSnapshot } from "@/lib/audit";
import { RECRUITER_SKILLS, RECRUITER_TOKENS } from "@/lib/emphasize";
import type { GhRepo } from "@/lib/github";
import { mailTo } from "@/lib/mail";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { linkLabel } from "@/lib/labels";
import { CV_FILENAME, CV_PATH, SITE_HOST, SITE_NAME, SITE_REPO } from "@/lib/site";
import { SpotlightLayer } from "@/components/SpotlightLayer";
import { SignalBoard, type SignalStrings } from "@/components/SignalBoard";

function projectLinks(project: Project, locale: Locale) {
  const t = copy[locale];
  return (
    <div className="links">
      {project.live ? (
        <a
          href={project.live}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={linkLabel(t.liveFor, project.name)}
        >
          {t.live}
        </a>
      ) : null}
      {project.href ? (
        <Link href={withLocale(locale, project.href)} aria-label={linkLabel(t.liveFor, project.name)}>
          {t.live}
        </Link>
      ) : null}
      {project.caseStudy ? (
        <Link
          href={withLocale(locale, `/work/${project.caseStudy}`)}
          aria-label={linkLabel(t.caseStudyFor, project.name)}
        >
          {t.caseStudy}
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
        </a>
      ) : project.private ? (
        <span className="badge private">{t.private}</span>
      ) : null}
    </div>
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
  repos,
  audit,
  initialLocale,
}: {
  repos: GhRepo[];
  audit: AuditSnapshot;
  initialLocale: Locale;
}) {
  const locale = initialLocale;
  const t = copy[locale];
  const hits = t.hits;
  const tokens = [...hits, ...RECRUITER_TOKENS];
  const spotlight = featured.filter((item) => item.spotlight);
  const restWork = featured.filter((item) => !item.spotlight);

  const featuredNames = new Set(featured.map((item) => item.name.toLowerCase().replace(/\s+/g, "-")));
  const featuredUrls = new Set(featured.map((item) => item.repo).filter(Boolean));
  const extraRepos = repos.filter((repo) => {
    if (featuredNames.has(repo.name.toLowerCase())) return false;
    if (featuredUrls.has(repo.html_url)) return false;
    return true;
  });

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
          <Link className="brand" href={`${withLocale(locale, "/")}#intro`}>
            <BrandMark />
            {SITE_NAME}
          </Link>
          <nav className="nav" aria-label={t.navLabel}>
            <a href="#projects">{t.projectsTitle}</a>
            <a href="#work">{t.workTitle}</a>
            <a href="#contact">{t.contactTitle}</a>
            <a
              href={SITE_REPO}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={linkLabel(t.sourceFor, SITE_HOST)}
            >
              {t.source}
            </a>
            <a className="nav-hire" href={mailTo(t.hireSubject)}>
              {t.hireCta}
            </a>
            <LanguageSwitcher locale={locale} langLabel={t.lang} />
            <ThemeSwitcher label={t.theme} names={t.themeNames} />
          </nav>
        </header>

        <main id="main" className="sheet">
          <section id="intro" className="hero">
            <p className="kicker">{t.kicker}</p>
            <h1>{SITE_NAME}</h1>
            <p className="role">{t.headline}</p>
            <p className="seeking">{t.seeking}</p>
            <p className="tagline">{t.tagline}</p>
            <div className="meta-row">
              <span className="hit">{t.place}</span>
              <span className="hit">{t.now}</span>
            </div>
            <p className="lede">
              <Emphasize text={t.lede} phrases={hits} />
            </p>
            <p className="proof-metric">{t.proofMetric}</p>
            <ProofLine text={t.proofLine} />
            <div className="cta-row">
              <a className="cta" href={mailTo(t.hireSubject)}>
                {t.hireCta}
              </a>
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
          </section>

          <section id="projects" className="section">
            <h2>{t.projectsTitle}</h2>
            <div className="grid-cards">
              {spotlight.map((project) => (
                <article className="card" key={project.name}>
                  <div className={project.private ? "badge private" : "badge"}>
                    {project.live ? t.live : project.private ? t.private : t.public}
                  </div>
                  <h3>{project.name}</h3>
                  <p>{project.blurb[locale]}</p>
                  <div className="chips">
                    {project.stack.map((item) => (
                      <span className="chip" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
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
                      <div className="muted">{project.blurb[locale]}</div>
                    </div>
                    {projectLinks(project, locale)}
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section id="work" className="section">
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

          <section id="skills" className="section">
            <h2>{t.skillsTitle}</h2>
            <div className="skill-groups">
              {(Object.keys(skills) as Array<keyof typeof skills>).map((group) => (
                <div key={group}>
                  <div className="skill-label">{t.skillGroups[group]}</div>
                  <div className="chips">
                    {skills[group].map((item) => (
                      <span className={RECRUITER_SKILLS.has(item) ? "chip hit" : "chip"} key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="contact" className="section">
            <h2>{t.contactTitle}</h2>
            <p className="lede">
              <Emphasize text={t.contactLede} phrases={hits} />
            </p>
            <div className="path-grid">
              <article className="card path-card">
                <div className="kicker">{t.hirePath}</div>
                <h3>{t.hireCta}</h3>
                <p>
                  <Emphasize text={t.hirePathLede} phrases={hits} />
                </p>
                <a className="cta" href={mailTo(t.hireSubject)}>
                  {t.hireCta}
                </a>
              </article>
              <article className="card path-card">
                <div className="kicker">{t.buildPath}</div>
                <h3>{t.buildCta}</h3>
                <p>{t.buildPathLede}</p>
                <a className="cta ghost" href={mailTo(t.buildSubject)}>
                  {t.buildCta}
                </a>
              </article>
            </div>
            <div className="contact-panel">
              <div className="kicker">{t.writeCta}</div>
              <a className="contact-email" href={`mailto:${contact.email}`}>
                {contact.email}
              </a>
              <div className="contact">
                <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
                <a href={contact.github} target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </div>
            </div>
          </section>

          <section id="signal" className="section">
            <h2>{t.signalTitle}</h2>
            <SignalBoard audit={audit} strings={signalStrings} showHeading={false} />
          </section>

          <section id="edu" className="section">
            <h2>{t.eduTitle}</h2>
            {education[locale].map((item) => (
              <p className="edu-line" key={item}>
                {item}
              </p>
            ))}
            <h3 className="subhead">{t.langsTitle}</h3>
            <p>{languages[locale]}</p>
          </section>

          <details id="more" className="archive">
            <summary>
              <span className="fold-title">{t.atticTitle}</span>
            </summary>
            <div className="archive-body">
              <h3 className="subhead">{t.labTitle}</h3>
              <p className="lede">{t.labLede}</p>
              <ul className="lab-list">
                {lab.map((idea) => (
                  <li key={idea.name}>
                    {idea.href ? (
                      <Link href={withLocale(locale, idea.href)}>{idea.name}</Link>
                    ) : (
                      <strong>{idea.name}</strong>
                    )}
                    <span className="muted"> — {idea.blurb[locale]}</span>
                  </li>
                ))}
              </ul>
              {extraRepos.length > 0 ? (
                <>
                  <h3 className="subhead">{t.moreTitle}</h3>
                  {extraRepos.slice(0, 8).map((repo) => (
                    <div className="repo-row" key={repo.html_url}>
                      <div>
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                          {repo.name}
                        </a>
                        <div className="muted">{repo.description ?? repo.language}</div>
                      </div>
                      <span className="muted">{repo.language}</span>
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          </details>
        </main>

        <footer>
          <span>{t.footer}</span>
          {" · "}
          <Link href={withLocale(locale, "/cv")}>{t.cvTitle}</Link>
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
