import { skipRepos } from "@/data/projects";
import { GITHUB_USER } from "@/lib/site";

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

export async function fetchPublicRepos(): Promise<GhRepo[]> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  // Optional: lifts the unauthenticated 60 req/hr shared-IP limit on serverless.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
      { next: { revalidate: 3600 }, headers },
    );
    if (!response.ok) {
      console.warn(
        JSON.stringify({ type: "github-repos", ok: false, status: response.status }),
      );
      return [];
    }
    const rows = (await response.json()) as GhRepo[];
    return rows.filter(isListedRepo);
  } catch (error) {
    console.warn(
      JSON.stringify({ type: "github-repos", ok: false, error: (error as Error).message }),
    );
    return [];
  }
}
