import { careerBreak, contact, copy, education, experience, languages, skills } from "@/data/copy";
import type { Locale } from "@/lib/locale";
import { SITE_NAME } from "@/lib/site";

export function PrintDesk({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <article className="print-cv">
      <h1>{SITE_NAME}</h1>
      <p className="role">{t.headline}</p>
      <p className="seeking">{t.seeking}</p>
      <p>
        {contact.email} · {contact.linkedin} · {contact.github}
      </p>
      <h2>{t.workTitle}</h2>
      <section>
        <h3>
          {t.breakTitle} — {careerBreak[locale].title} · {careerBreak[locale].when}
        </h3>
        <p>{careerBreak[locale].body}</p>
      </section>
      {experience[locale].map((job) => (
        <section key={job.org + job.when}>
          <h3>
            {job.org} — {job.title} · {job.when}
          </h3>
          <p>{job.body}</p>
          <ul>
            {job.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ))}
      <h2>{t.skillsTitle}</h2>
      {(Object.keys(skills) as Array<keyof typeof skills>).map((group) => (
        <p key={group}>
          <strong>{t.skillGroups[group]}:</strong> {skills[group].join(" · ")}
        </p>
      ))}
      <h2>{t.eduTitle}</h2>
      {education[locale].map((item) => (
        <p key={item}>{item}</p>
      ))}
      <h2>{t.langsTitle}</h2>
      <p>{languages[locale]}</p>
    </article>
  );
}
