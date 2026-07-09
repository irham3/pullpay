import { NextResponse } from "next/server";
import { getStoredReward, upsertRewardPr, patchStoredReward } from "@/lib/server/store";
import { fetchPr, closingIssue } from "@/lib/server/github";

export const runtime = "nodejs";

// POST /api/rewards/:id/pr — a contributor links the PR they opened to the funded
// issue. This is the contributor-driven relation: the PR must reference the
// issue ("closes #N"), which is what ties their work to the reward. It only adds
// a candidate to the maintainer's list — it can never move money (payout still
// requires a real merge and the author's own linked wallet).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !/^0x[0-9a-fA-F]{64}$/.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  let body: { pr?: number | string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const reward = await getStoredReward(id);
  if (!reward) {
    return NextResponse.json({ error: "unknown reward" }, { status: 404 });
  }

  const prNumber = body.url ? parsePrUrl(body.url) : Number(body.pr);
  if (!prNumber || prNumber <= 0) {
    return NextResponse.json(
      { error: "a PR number or github PR url is required" },
      { status: 400 }
    );
  }

  let pr;
  try {
    pr = await fetchPr(reward.repo, prNumber);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PR not found" },
      { status: 404 }
    );
  }

  // The PR must declare it closes this reward's issue — that reference is the
  // link. Without it, any PR in the repo could be attached.
  const linked = closingIssue(`${pr.title}\n${pr.body}`);
  if (linked !== reward.issueNumber) {
    return NextResponse.json(
      {
        error: `PR #${prNumber} does not reference issue #${reward.issueNumber}`,
        hint: `add "closes #${reward.issueNumber}" to your PR description, then submit again`,
      },
      { status: 409 }
    );
  }

  const prs = await upsertRewardPr(id, {
    number: pr.number,
    author: pr.author,
    title: pr.title,
    url: pr.url,
    state: pr.state,
    createdAt: pr.createdAt || undefined,
    updatedAt: Math.floor(Date.now() / 1000),
    source: "contributor",
  });

  // Surface the work on the board without overriding a settled/merged reward.
  if (reward.status === "Open") {
    await patchStoredReward(id, { status: "In Review" });
  }

  return NextResponse.json({ ok: true, pr: { number: pr.number, state: pr.state }, prs });
}

function parsePrUrl(url: string): number | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean); // owner/repo/pull/123
    if (parts.length < 4 || (parts[2] !== "pull" && parts[2] !== "pulls")) return null;
    const n = Number(parts[3]);
    return n > 0 ? n : null;
  } catch {
    return null;
  }
}
