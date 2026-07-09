import { NextResponse } from "next/server";
import { listStoredRewards, saveReward } from "@/lib/server/store";
import { syncRewards, ingestReward } from "@/lib/server/indexer";
import { DEMO_MODE } from "@/lib/contracts/addresses";

export const runtime = "nodejs";

// GET /api/rewards — every funded reward, shared across all users. Runs an
// incremental server-side chain sync first (throttled), so the browser never
// issues eth_getLogs itself and everyone sees rewards funded by any maintainer.
export async function GET() {
  try {
    await syncRewards();
  } catch (e) {
    // Serve what we have; the persisted scan cursor resumes on the next poll.
    console.error("[/api/rewards] sync error:", e instanceof Error ? e.message : e);
  }
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

// POST /api/rewards — index a freshly created reward right away (instead of
// waiting for the next log scan). The caller only names the id; every field is
// read from the chain and GitHub server-side, so nothing here is spoofable.
export async function POST(req: Request) {
  if (DEMO_MODE) return NextResponse.json({ ok: false, demo: true });

  let body: { id?: string; fundingTx?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const id = body.id as `0x${string}` | undefined;
  if (!id || !/^0x[0-9a-fA-F]{64}$/.test(id)) {
    return NextResponse.json({ error: "valid id required" }, { status: 400 });
  }

  try {
    const record = await ingestReward(id);
    if (!record) {
      return NextResponse.json(
        { error: "no such reward on-chain" },
        { status: 404 }
      );
    }
    // fundingTx is cosmetic (explorer link); accept it only in the right shape.
    const fundingTx = body.fundingTx;
    if (fundingTx && /^0x[0-9a-fA-F]{64}$/.test(fundingTx)) {
      await saveReward({ ...record, fundingTx: fundingTx as `0x${string}` });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ingest failed" },
      { status: 502 }
    );
  }
}
