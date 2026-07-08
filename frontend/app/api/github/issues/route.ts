import { NextResponse } from "next/server";
import { fetchIssue } from "@/lib/server/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GH = "https://api.github.com";

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "PullPay-Relayer",
  };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

// GET /api/github/issues?repo=owner/repo
// Returns open issues for a repo. Used by the GitHub-first /create flow.
// Also supports: GET /api/github/issues?url=https://github.com/owner/repo/issues/123
// to validate + parse a manually entered GitHub issue URL.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // --- Mode 1: Parse a full GitHub URL (manual fallback) ---
  const url = searchParams.get("url");
  if (url) {
    const parsed = parseGitHubIssueUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub issue URL. Expected format: https://github.com/owner/repo/issues/123" },
        { status: 400 }
      );
    }
    try {
      const info = await fetchIssue(`${parsed.owner}/${parsed.repo}`, parsed.issue);
      return NextResponse.json({
        owner: parsed.owner,
        repo: parsed.repo,
        full_name: `${parsed.owner}/${parsed.repo}`,
        issue: parsed.issue,
        ...info,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Issue not found" },
        { status: 404 }
      );
    }
  }

  // --- Mode 2: List open issues for a repo ---
  const repo = searchParams.get("repo");
  if (!repo || !repo.includes("/")) {
    return NextResponse.json(
      { error: "repo (owner/repo) query param required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${GH}/repos/${repo}/issues?state=open&per_page=50&sort=created&direction=desc`,
      { headers: headers(), cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub API error (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json();
    // Filter out pull requests (GitHub API returns PRs via the issues endpoint).
    const issues = (data as Array<Record<string, unknown>>)
      .filter((item) => !item.pull_request)
      .map((item) => ({
        number: item.number as number,
        title: item.title as string,
        labels: ((item.labels as Array<{ name?: string } | string>) ?? []).map(
          (l) => (typeof l === "string" ? l : (l.name ?? ""))
        ),
        state: item.state as string,
        url: item.html_url as string,
      }));

    return NextResponse.json({ issues });
  } catch (e) {
    console.error("[/api/github/issues]", e);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 502 }
    );
  }
}

/** Parse https://github.com/owner/repo/issues/123 → { owner, repo, issue } */
function parseGitHubIssueUrl(url: string): { owner: string; repo: string; issue: number } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    // pathname: /owner/repo/issues/123
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 4 || parts[2] !== "issues") return null;
    const issue = Number(parts[3]);
    if (!issue || issue <= 0) return null;
    return { owner: parts[0], repo: parts[1], issue };
  } catch {
    return null;
  }
}
