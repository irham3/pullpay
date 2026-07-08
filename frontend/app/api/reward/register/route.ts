import { NextResponse } from "next/server";
import { setRewardForIssue } from "@/lib/server/store";
import { readReward } from "@/lib/server/relayer";
import { DEMO_MODE } from "@/lib/contracts/addresses";

// POST /api/reward/register — links a repo#issue → rewardId so the webhook can
// find it instantly. Verified on-chain first (repo+issue must match the record)
// so a caller can't poison the mapping.
export async function POST(req: Request) {
  if (DEMO_MODE) return NextResponse.json({ ok: false, demo: true });
  let body: { rewardId?: string; repo?: string; issue?: number | string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const rewardId = body.rewardId as `0x${string}`;
  const repo = String(body.repo || "");
  const issue = Number(body.issue);
  if (!rewardId || !/^0x[0-9a-fA-F]{64}$/.test(rewardId) || !repo || !issue) {
    return NextResponse.json({ error: "rewardId, repo, issue required" }, { status: 400 });
  }

  try {
    const r = await readReward(rewardId);
    if (
      r.repo.toLowerCase() !== repo.toLowerCase() ||
      Number(r.issueNumber) !== issue
    ) {
      return NextResponse.json(
        { error: "rewardId does not match repo/issue on-chain" },
        { status: 409 }
      );
    }
    await setRewardForIssue(repo, issue, rewardId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "register failed" },
      { status: 500 }
    );
  }
}
