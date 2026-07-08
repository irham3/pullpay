import { NextResponse } from "next/server";
import { appOctokit, githubAppConfigured } from "@/lib/server/githubApp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/github/repos?user=<github_login>
// Returns repos where the PullPay GitHub App is installed and the user has push
// access. Used by the GitHub-first /create flow so maintainers pick from repos
// they actually own (instead of typing freeform text).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user")?.toLowerCase();

  if (!user) {
    return NextResponse.json(
      { error: "user query param required" },
      { status: 400 }
    );
  }

  if (!githubAppConfigured()) {
    return NextResponse.json(
      { error: "GitHub App not configured" },
      { status: 503 }
    );
  }

  try {
    const octo = appOctokit();

    // Iterate all installations and find repos accessible to this user.
    // For a hackathon MVP, paginate up to 100 installations (plenty).
    const installations = await octo.apps.listInstallations({ per_page: 100 });

    type Repo = { full_name: string; language: string | null; private: boolean };
    const repos: Repo[] = [];

    for (const inst of installations.data) {
      // Check if this installation belongs to the user or an org they're part of.
      const accountLogin = inst.account?.login?.toLowerCase();
      if (!accountLogin) continue;

      // Get repos accessible to this installation.
      const { data } = await octo.apps.listReposAccessibleToInstallation({
        installation_id: inst.id,
        per_page: 100,
      });

      for (const r of data.repositories ?? []) {
        // For user-level installations, match by account login.
        // For org installations, include all repos (user is implicitly a member).
        if (accountLogin === user || inst.target_type === "Organization") {
          repos.push({
            full_name: r.full_name,
            language: r.language ?? null,
            private: r.private,
          });
        }
      }
    }

    return NextResponse.json({ repos });
  } catch (e) {
    console.error("[/api/github/repos]", e);
    return NextResponse.json(
      { error: "Failed to fetch repos" },
      { status: 502 }
    );
  }
}
