import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { listStoredRewards, saveReward } from "@/lib/server/store";
import { readReward } from "@/lib/server/relayer";
import { DEMO_MODE } from "@/lib/contracts/addresses";
import type { StoredReward } from "@/lib/types";

export const runtime = "nodejs";

// GET /api/rewards — every funded reward, shared across all users. This replaces
// the old per-browser localStorage listing so a contributor sees rewards funded
// by any maintainer, not just ones created in their own browser.
export async function GET() {
  try {
    const rewards = await listStoredRewards();
    return NextResponse.json({ rewards });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "list failed", rewards: [] },
      { status: 500 }
    );
  }
}

// POST /api/rewards — persist reward metadata at create time. Verified on-chain
// first (maintainer + repo + issue must match the record) so a caller can't
// inject or overwrite someone else's reward.
export async function POST(req: Request) {
  let body: Partial<StoredReward>;
  try {
    body = (await req.json()) as Partial<StoredReward>;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const id = body.id as `0x${string}` | undefined;
  if (!id || !/^0x[0-9a-fA-F]{64}$/.test(id) || !body.repo || !body.maintainer) {
    return NextResponse.json(
      { error: "id, repo, maintainer required" },
      { status: 400 }
    );
  }
  if (!isAddress(body.maintainer)) {
    return NextResponse.json({ error: "invalid maintainer" }, { status: 400 });
  }

  if (!DEMO_MODE) {
    try {
      const r = await readReward(id);
      const match =
        r.maintainer.toLowerCase() === body.maintainer.toLowerCase() &&
        r.repo.toLowerCase() === String(body.repo).toLowerCase() &&
        Number(r.issueNumber) === Number(body.issueNumber);
      if (!match) {
        return NextResponse.json(
          { error: "record does not match reward on-chain" },
          { status: 409 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "on-chain verify failed" },
        { status: 502 }
      );
    }
  }

  try {
    await saveReward(body as StoredReward);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "save failed" },
      { status: 500 }
    );
  }
}
