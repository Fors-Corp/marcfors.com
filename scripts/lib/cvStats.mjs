/**
 * Live GitHub stats for the downloadable CV.
 *
 * Contributions come from the public contribution calendar (no token).
 * PR counts use the Search API (`author:<user> type:pr …`); set GITHUB_TOKEN
 * when running in CI so the search quota is not the unauthenticated 10/min.
 */

export const CV_GITHUB_USER = "marcfs31";

const NUM = String.raw`\d{1,3}(?:,\d{3})*`;
/** Matches the Fors Corp bullet's activity clause in the CV DOCX. */
export const CV_ACTIVITY_RE = new RegExp(
  String.raw`(${NUM}) GitHub contributions in the past year; (\d+) pull requests \((\d+) merged\) across (\d+) repositories in the last 30 days\.`,
);

export function formatCount(n) {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error(`Invalid count: ${n}`);
  return n.toLocaleString("en-US");
}

export function activityClause({ contributions, pullRequests, merged, repositories }) {
  return (
    `${formatCount(contributions)} GitHub contributions in the past year; ` +
    `${pullRequests} pull requests (${merged} merged) across ${repositories} ` +
    `repositories in the last 30 days.`
  );
}

export function replaceActivityClause(text, stats) {
  if (!CV_ACTIVITY_RE.test(text)) {
    throw new Error("CV activity clause not found — refusing to patch");
  }
  return text.replace(CV_ACTIVITY_RE, activityClause(stats));
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

/** Same calendar parser contract as src/lib/githubActivity.ts (kept JS for scripts/). */
export function parseContributionCalendar(html) {
  const counts = new Map();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g)) {
    const id = attribute(match[1], "for");
    const count = match[2].trim().match(/^(No|[\d,]+) contributions?\b/);
    if (id && count) counts.set(id, count[1] === "No" ? 0 : Number(count[1].replaceAll(",", "")));
  }
  const days = [];
  for (const [tag] of html.matchAll(/<td\b[^>]*\bdata-date="[^"]*"[^>]*>/g)) {
    const date = attribute(tag, "data-date");
    const level = attribute(tag, "data-level");
    const count = counts.get(attribute(tag, "id") ?? "");
    if (
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      !level ||
      !/^[0-4]$/.test(level) ||
      count === undefined ||
      !Number.isSafeInteger(count) ||
      count < 0
    ) {
      throw new Error("Invalid GitHub contribution day");
    }
    days.push({ date, level: Number(level), count });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (
    days.length < 350 ||
    days.length > 378 ||
    days.some((day, i) => i > 0 && Date.parse(day.date) - Date.parse(days[i - 1].date) !== 86_400_000)
  ) {
    throw new Error("Incomplete GitHub contribution calendar");
  }
  return days;
}

/** Sum contributions over the trailing 365 calendar days (inclusive of today UTC). */
export function sumTrailingYear(days, today = new Date()) {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 364);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);
  return days
    .filter((d) => d.date >= startIso && d.date <= endIso)
    .reduce((sum, d) => sum + d.count, 0);
}

export function isoDaysAgo(days, today = new Date()) {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function githubJson(url, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "marcfors.com-cv-update",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${url}`);
  }
  return response.json();
}

async function searchTotal(query, token) {
  const url =
    `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=1`;
  const body = await githubJson(url, token);
  if (!Number.isSafeInteger(body.total_count) || body.total_count < 0) {
    throw new Error(`Invalid search total for ${query}`);
  }
  return body.total_count;
}

/** Unique repository_url values across every page of a PR search. */
async function searchUniqueRepos(query, token) {
  const repos = new Set();
  let page = 1;
  let total = Infinity;
  while ((page - 1) * 100 < total && page <= 10) {
    const url =
      `https://api.github.com/search/issues?q=${encodeURIComponent(query)}` +
      `&per_page=100&page=${page}`;
    const body = await githubJson(url, token);
    total = body.total_count;
    for (const item of body.items ?? []) {
      if (typeof item.repository_url === "string") repos.add(item.repository_url);
    }
    if (!body.items?.length) break;
    page += 1;
  }
  return repos.size;
}

export async function fetchCvStats({
  user = CV_GITHUB_USER,
  token = process.env.GITHUB_TOKEN,
  today = new Date(),
  fetchImpl = fetch,
} = {}) {
  const calendarUrl = `https://github.com/users/${user}/contributions`;
  const calendarRes = await fetchImpl(calendarUrl, {
    headers: { Accept: "text/html", "Accept-Language": "en", "User-Agent": "marcfors.com-cv-update" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!calendarRes.ok) throw new Error(`Contribution calendar HTTP ${calendarRes.status}`);
  const days = parseContributionCalendar(await calendarRes.text());
  const contributions = sumTrailingYear(days, today);

  const since = isoDaysAgo(30, today);
  const createdQ = `author:${user} type:pr created:>=${since}`;
  const mergedQ = `author:${user} type:pr is:merged merged:>=${since}`;

  // Wire token into the module-level helper via env for tests that pass token.
  const prev = process.env.GITHUB_TOKEN;
  if (token) process.env.GITHUB_TOKEN = token;
  try {
    const [pullRequests, merged, repositories] = await Promise.all([
      searchTotal(createdQ, token),
      searchTotal(mergedQ, token),
      searchUniqueRepos(createdQ, token),
    ]);
    return { contributions, pullRequests, merged, repositories, since };
  } finally {
    if (token) {
      if (prev === undefined) delete process.env.GITHUB_TOKEN;
      else process.env.GITHUB_TOKEN = prev;
    }
  }
}
