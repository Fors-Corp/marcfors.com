"use client";

import { useEffect, useRef, useState } from "react";
import type { ActivityStrings } from "@/data/copy/types";
import type { ActivitySnapshot, ContributionDay } from "@/lib/githubActivity";
import type { Locale } from "@/lib/locale";
import { GITHUB_URL } from "@/lib/site";

function Calendar({ days, locale, strings: t }: {
  days: ContributionDay[];
  locale: Locale;
  strings: ActivityStrings;
}) {
  const chart = useRef<HTMLDivElement>(null);
  const [showDays, setShowDays] = useState(false);
  useEffect(() => {
    if (chart.current) chart.current.scrollLeft = chart.current.scrollWidth;
  }, [days]);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const monthFormat = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
  const firstWeekday = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const columns = Math.ceil((days.length + firstWeekday) / 7);
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const number = new Intl.NumberFormat(locale);
  const label = `${number.format(total)} ${t.contributions} · ${dateFormat.format(new Date(days[0].date))} – ${dateFormat.format(new Date(days.at(-1)!.date))}`;
  return (
    <div className="activity-calendar">
      <h3>{t.calendar}</h3>
      <p className="activity-total">{label}</p>
      <div ref={chart} className="activity-chart" tabIndex={0} role="region" aria-label={t.calendar}>
        <svg viewBox={`0 0 ${columns * 12} 104`} role="img" aria-label={label}>
        {days.map((day, index) => {
          const column = Math.floor((index + firstWeekday) / 7);
          const row = (index + firstWeekday) % 7;
          return (
            <rect key={day.date} x={column * 12} y={20 + row * 12} width="9" height="9" rx="1"
              className={`contribution-level-${day.level}`}>
              <title>{dateFormat.format(new Date(day.date))}: {number.format(day.count)} {t.contributions}</title>
            </rect>
          );
        })}
        {days.filter((day) => day.date.endsWith("-01") && new Date(day.date).getUTCMonth() % 2 === 0).map((day) => {
          const index = days.indexOf(day);
          const x = Math.floor((index + firstWeekday) / 7) * 12;
          return <text key={day.date} x={x} y="10">{monthFormat.format(new Date(day.date))}</text>;
        })}
        </svg>
      </div>
      <div className="activity-legend" aria-hidden="true">
        <span>{t.less}</span>
        {[0, 1, 2, 3, 4].map((level) => <i key={level} className={`contribution-level-${level}`} />)}
        <span>{t.more}</span>
      </div>
      <details onToggle={(event) => setShowDays(event.currentTarget.open)}>
        <summary>{t.daily}</summary>
        {showDays ? (
          <ul className="activity-days">
            {[...days].reverse().map((day) => (
              <li key={day.date}>
                <time dateTime={day.date}>{dateFormat.format(new Date(day.date))}</time>
                <span>{number.format(day.count)} {t.contributions}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </details>
    </div>
  );
}

export function GitHubActivity({ locale, strings: t }: { locale: Locale; strings: ActivityStrings }) {
  const section = useRef<HTMLElement>(null);
  const [snapshot, setSnapshot] = useState<ActivitySnapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let inView = false;
    let controller: AbortController | null = null;
    let lastAttempt = 0;
    const refresh = async () => {
      if (!inView || document.visibilityState === "hidden" || controller ||
          Date.now() - lastAttempt < 300_000) return;
      controller = new AbortController();
      lastAttempt = Date.now();
      try {
        const response = await fetch("/api/github-activity", { signal: controller.signal });
        if (!response.ok) throw new Error(`GitHub activity: HTTP ${response.status}`);
        const body: ActivitySnapshot = await response.json();
        setSnapshot(body);
        setFailed(body.events === null || body.calendar === null);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setFailed(true);
      } finally {
        controller = null;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      void refresh();
    }, { rootMargin: "200px" });
    if (section.current) observer.observe(section.current);
    const timer = window.setInterval(() => void refresh(), 300_000);
    const visible = () => void refresh();
    document.addEventListener("visibilitychange", visible);
    return () => {
      observer.disconnect();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      controller?.abort();
    };
  }, []);

  const dateFormat = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium", timeStyle: "short", timeZone: "UTC",
  });

  return (
    <section ref={section} id="github" className="section" aria-labelledby="github-title">
      <div className="activity-heading">
        <h2 id="github-title">{t.title}</h2>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">{t.profile} ↗</a>
      </div>
      <p className="lede">{t.lede}</p>
      <div className="activity-status" role="status" aria-atomic="true">
        {failed ? <p>{t.unavailable}</p> : !snapshot ? <p>{t.loading}</p> : (
          <p className="muted">{t.checked}{" "}
            <time dateTime={snapshot.checkedAt}>{dateFormat.format(new Date(snapshot.checkedAt))} UTC</time>
          </p>
        )}
      </div>
      <div className="activity-body">
        {snapshot?.calendar?.length ? <Calendar days={snapshot.calendar} locale={locale} strings={t} /> : null}
        {snapshot?.events ? (
          <div className="activity-feed">
            <h3>{t.recent}</h3>
            {snapshot.events.length === 0 ? <p className="muted">{t.empty}</p> : (
              <ul>
                {snapshot.events.map((event) => (
                  <li key={event.id}>
                    <div>
                      <span className="muted">{t.kinds[event.kind]}</span>
                      <a href={event.url} target="_blank" rel="noopener noreferrer">{event.repo}</a>
                    </div>
                    <time dateTime={event.date}>{dateFormat.format(new Date(event.date))} UTC</time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
