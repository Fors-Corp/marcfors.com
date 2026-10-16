import { GITHUB_USER } from "@/lib/site";

export type ActivityKind = "push" | "pullRequest" | "issue" | "release";
export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  repo: string;
  url: string;
  date: string;
};
export type ContributionDay = { date: string; count: number; level: number };
export type ActivitySnapshot = {
  events: ActivityEvent[] | null;
  calendar: ContributionDay[] | null;
  checkedAt: string;
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

export function parsePublicEvents(body: unknown): ActivityEvent[] {
  if (!Array.isArray(body)) throw new Error("Invalid GitHub events response");
  return body.flatMap((value): ActivityEvent[] => {
    const event = record(value);
    const repo = record(event.repo).name;
    const actor = record(event.actor).login;
    if (event.public !== true || typeof actor !== "string" ||
        actor.toLowerCase() !== GITHUB_USER.toLowerCase() ||
        typeof repo !== "string" || !/^[\w.-]+\/[\w.-]+$/.test(repo) ||
        typeof event.id !== "string" || !/^\d+$/.test(event.id) ||
        typeof event.created_at !== "string" || !Number.isFinite(Date.parse(event.created_at))) return [];

    const payload = record(event.payload);
    const base = `https://github.com/${repo}`;
    let kind: ActivityKind;
    let url: string;
    switch (event.type) {
      case "PushEvent":
        kind = "push";
        url = typeof payload.head === "string" && /^[a-f0-9]{40}$/i.test(payload.head)
          ? `${base}/commit/${payload.head}` : `${base}/commits`;
        break;
      case "PullRequestEvent":
      case "IssuesEvent": {
        const number = record(event.type === "PullRequestEvent" ? payload.pull_request : payload.issue).number;
        if (!Number.isSafeInteger(number) || typeof number !== "number" || number < 1) return [];
        kind = event.type === "PullRequestEvent" ? "pullRequest" : "issue";
        url = `${base}/${kind === "pullRequest" ? "pull" : "issues"}/${number}`;
        break;
      }
      case "ReleaseEvent":
        if (payload.action !== "published") return [];
        kind = "release";
        url = `${base}/releases`;
        break;
      default:
        return [];
    }
    return [{ id: event.id, kind, repo, url, date: event.created_at }];
  }).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 6);
}

function attribute(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
}

/** GitHub's public calendar fragment needs no token; never inject its HTML. */
export function parseContributionCalendar(html: string): ContributionDay[] {
  const counts = new Map<string, number>();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g)) {
    const id = attribute(match[1], "for");
    const count = match[2].trim().match(/^(No|[\d,]+) contributions?\b/);
    if (id && count) counts.set(id, count[1] === "No" ? 0 : Number(count[1].replaceAll(",", "")));
  }
  const days: ContributionDay[] = [];
  for (const [tag] of html.matchAll(/<td\b[^>]*\bdata-date="[^"]*"[^>]*>/g)) {
    const date = attribute(tag, "data-date");
    const level = attribute(tag, "data-level");
    const count = counts.get(attribute(tag, "id") ?? "");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        !level || !/^[0-4]$/.test(level) || count === undefined ||
        !Number.isSafeInteger(count) || count < 0) {
      throw new Error("Invalid GitHub contribution day");
    }
    days.push({ date, level: Number(level), count });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 350 || days.length > 378 ||
      days.some((day, i) => i > 0 && Date.parse(day.date) - Date.parse(days[i - 1].date) !== 86_400_000)) {
    throw new Error("Incomplete GitHub contribution calendar");
  }
  return days;
}

async function load<T>(source: "events" | "calendar", read: (response: Response) => Promise<T>): Promise<T | null> {
  const url = source === "events"
    ? `https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`
    : `https://github.com/users/${GITHUB_USER}/contributions`;
  const headers: Record<string, string> = {
    Accept: source === "events" ? "application/vnd.github+json" : "text/html",
    "Accept-Language": "en",
  };
  // Authentication is optional and sent only to the public-events API.
  if (source === "events" && process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  try {
    const response = await fetch(url, {
      headers,
      cache: "force-cache",
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await read(response);
  } catch (error) {
    console.warn(JSON.stringify({
      type: "github-activity", source, ok: false,
      error: error instanceof Error ? error.message : "Unknown upstream failure",
    }));
    return null;
  }
}

export async function fetchGitHubActivity(): Promise<ActivitySnapshot> {
  const [events, calendar] = await Promise.all([
    load("events", async (response) => parsePublicEvents(await response.json())),
    load("calendar", async (response) => parseContributionCalendar(await response.text())),
  ]);
  return { events, calendar, checkedAt: new Date().toISOString() };
}
