import { NextResponse } from "next/server";
import { fetchIssue } from "@/lib/server/github";

// GET /api/github/issue?repo=owner/repo&issue=123 — enrich the create form.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repo = searchParams.get("repo");
  const issue = Number(searchParams.get("issue"));

  if (!repo || !repo.includes("/") || !issue) {
    return NextResponse.json(
      { error: "repo (owner/repo) and issue are required" },
      { status: 400 }
    );
  }

  try {
    const info = await fetchIssue(repo, issue);
    return NextResponse.json(info);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "lookup failed" },
      { status: 502 }
    );
  }
}
