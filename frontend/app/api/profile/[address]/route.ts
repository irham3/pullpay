import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getSettledPayouts } from "@/lib/server/store";
import { syncRewards } from "@/lib/server/indexer";

export const runtime = "nodejs";

// GET /api/profile/:address — contributor reputation from indexed RewardSettled
// events. Replaces the per-browser log scan (public RPCs rejected the range).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  if (!isAddress(address)) {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }

  try {
    await syncRewards();
  } catch {
    // Serve what's already indexed.
  }

  try {
    const payouts = await getSettledPayouts(address);
    const repos = new Set(payouts.map((p) => p.repo));
    return NextResponse.json({
      address,
      totalEarned: payouts.reduce((s, p) => s + p.amount, 0),
      contributions: payouts.length,
      reposCount: repos.size,
      attestations: payouts.map((p) => ({
        uid: p.attestationUID,
        repo: p.repo,
        issueNumber: p.issueNumber,
        amount: p.amount,
        contributionType: "contribution",
        date: p.date,
        txHash: p.txHash,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "profile read failed" },
      { status: 500 }
    );
  }
}
