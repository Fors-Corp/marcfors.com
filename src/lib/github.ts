import { skipRepos } from "@/data/projects";
import { GITHUB_ORG, GITHUB_USER } from "@/lib/site";

export type GhRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  homepage: string | null;
  pushed_at: string;
  fork: boolean;
};

export function isListedRepo(repo: GhRepo): boolean {
  return (
    !repo.fork &&
    !skipRepos.has(repo.name) &&
    Boolean(repo.description || repo.language) &&
    Boolean(repo.homepage)
  );
}

async function fetchRepoPage(url: string, headers: Record<string, string>): Promise<GhRepo[]> {
  const response = await fetch(url, { next: { revalidate: 3600 }, headers });
  if (!response.ok) {
    console.warn(
      JSON.stringify({ type: "github-repos", ok: false, status: response.status, url }),
    );
    return [];
  }
  return (await response.json()) as GhRepo[];
}

export async function fetchPublicRepos(): Promise<GhRepo[]> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  // Optional: lifts the unauthenticated 60 req/hr shared-IP limit on serverless.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const [userRepos, orgRepos] = await Promise.all([
      fetchRepoPage(
        `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
        headers,
      ),
      fetchRepoPage(
        `https://api.github.com/orgs/${GITHUB_ORG}/repos?per_page=100&sort=updated&type=public`,
        headers,
      ),
    ]);
    const byUrl = new Map<string, GhRepo>();
    for (const repo of [...userRepos, ...orgRepos]) {
      if (!byUrl.has(repo.html_url)) byUrl.set(repo.html_url, repo);
    }
    return [...byUrl.values()].filter(isListedRepo);
  } catch (error) {
    console.warn(
      JSON.stringify({ type: "github-repos", ok: false, error: (error as Error).message }),
    );
    return [];
  }
}
