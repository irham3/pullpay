import { NextResponse } from "next/server";
import { appOctokit, githubAppConfigured, installationOctokit } from "@/lib/server/githubApp";
import {
  githubSessionFromRequest,
  githubUserCanWriteRepo,
} from "@/lib/server/githubSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/github/repos?user=<github_login>
// Returns repos where the PullPay GitHub App is installed and the user has push
// access. Used by the GitHub-first /create flow so maintainers pick from repos
// they actually own (instead of typing freeform text).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = await githubSessionFromRequest(req);
  const userParam = searchParams.get("user")?.toLowerCase();

  if (!session) {
    return NextResponse.json(
      { error: "GitHub session required" },
      { status: 401 }
    );
  }
  const user = session.login.toLowerCase();
  if (userParam && userParam !== user) {
    return NextResponse.json({ error: "GitHub user mismatch" }, { status: 403 });
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
      const instOcto = installationOctokit(inst.id);
      const { data } = await instOcto.apps.listReposAccessibleToInstallation({
        per_page: 100,
      });

      for (const r of data.repositories ?? []) {
        const sameUserInstallation = accountLogin === user;
        const canWrite =
          sameUserInstallation ||
          (await githubUserCanWriteRepo(
            r.full_name,
            session.accessToken,
            session.login
          ));
        if (!canWrite) continue;
        repos.push({
          full_name: r.full_name,
          language: r.language ?? null,
          private: r.private,
        });
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
