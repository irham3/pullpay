import "server-only";

const GH = "https://api.github.com";

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "PullPay-Relayer",
  };
  // Optional token lifts the 60/hr unauthenticated rate limit.
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export interface MergeInfo {
  merged: boolean;
  intoDefaultBranch: boolean;
  author: string | null;
  title: string;
}

// Re-verify a merge server-side via the GitHub API — never trust the workflow
// signal alone (PRD §8.3 / §13).
export async function verifyMerge(repo: string, pr: number): Promise<MergeInfo> {
  const [prRes, repoRes] = await Promise.all([
    fetch(`${GH}/repos/${repo}/pulls/${pr}`, { headers: headers(), cache: "no-store" }),
    fetch(`${GH}/repos/${repo}`, { headers: headers(), cache: "no-store" }),
  ]);
  if (!prRes.ok) throw new Error(`GitHub PR lookup failed (${prRes.status})`);
  const prData = await prRes.json();
  const repoData = repoRes.ok ? await repoRes.json() : { default_branch: "main" };

  return {
    merged: Boolean(prData.merged || prData.merged_at),
    intoDefaultBranch: prData.base?.ref === repoData.default_branch,
    author: prData.user?.login ?? null,
    title: prData.title ?? "",
  };
}

export interface IssueInfo {
  title: string;
  labels: string[];
  language: string;
  state: string;
  url: string;
}

// Metadata used to enrich the create form + bounty board (PRD §27.2).
export async function fetchIssue(repo: string, issue: number): Promise<IssueInfo> {
  const [issueRes, repoRes] = await Promise.all([
    fetch(`${GH}/repos/${repo}/issues/${issue}`, { headers: headers(), cache: "no-store" }),
    fetch(`${GH}/repos/${repo}`, { headers: headers(), cache: "no-store" }),
  ]);
  if (!issueRes.ok) throw new Error(`GitHub issue lookup failed (${issueRes.status})`);
  const issueData = await issueRes.json();
  const repoData = repoRes.ok ? await repoRes.json() : { language: "" };

  return {
    title: issueData.title ?? "",
    labels: (issueData.labels ?? []).map((l: { name?: string } | string) =>
      typeof l === "string" ? l : (l.name ?? "")
    ),
    language: repoData.language ?? "",
    state: issueData.state ?? "open",
    url: issueData.html_url ?? `https://github.com/${repo}/issues/${issue}`,
  };
}
