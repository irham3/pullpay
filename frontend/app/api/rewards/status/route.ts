import { NextResponse } from "next/server";
import { verifyMessage } from "viem";
import { getStoredReward, setRewardStatus } from "@/lib/server/store";
import { readReward } from "@/lib/server/relayer";
import { DEMO_MODE } from "@/lib/contracts/addresses";
import { statusMessage, type UiStatus } from "@/lib/status";

export const runtime = "nodejs";

// The only statuses a maintainer may set by hand. Terminal/on-chain states
// (Verifying / Paid / Refunded / Rejected) are driven by the escrow contract and
// must never be forgeable off-chain.
const MANUAL_STATUSES: UiStatus[] = [
  "Open",
  "In Review",
  "Changes Requested",
  "Merged",
];

const MAX_SKEW = 5 * 60; // signed request valid for 5 minutes

// POST /api/rewards/status — a maintainer moves their reward through the
// off-chain review phase (Open ↔ In Review ↔ Changes Requested ↔ Merged).
// Authorised by a wallet signature recovered against the on-chain maintainer, so
// only the real funder can change it — fixing "status can't be changed by the
// maintainer". GitHub sync writes the same field from the webhook.
export async function POST(req: Request) {
  let body: { id?: string; status?: UiStatus; ts?: number; signature?: `0x${string}` };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const id = body.id as `0x${string}` | undefined;
  const status = body.status;
  const ts = Number(body.ts);
  const signature = body.signature;

  if (!id || !/^0x[0-9a-fA-F]{64}$/.test(id) || !status || !signature) {
    return NextResponse.json(
      { error: "id, status, ts, signature required" },
      { status: 400 }
    );
  }
  if (!MANUAL_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of ${MANUAL_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > MAX_SKEW) {
    return NextResponse.json({ error: "stale or missing timestamp" }, { status: 400 });
  }

  // Who owns this reward? On-chain is authoritative; fall back to the stored
  // record in demo mode (no escrow deployed).
  let maintainer: `0x${string}` | undefined;
  const stored = await getStoredReward(id);
  if (!stored) {
    return NextResponse.json({ error: "unknown reward" }, { status: 404 });
  }
  if (DEMO_MODE) {
    maintainer = stored.maintainer;
  } else {
    try {
      maintainer = (await readReward(id)).maintainer as `0x${string}`;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "on-chain read failed" },
        { status: 502 }
      );
    }
  }

  const message = statusMessage(id, status, ts);
  let valid = false;
  try {
    valid = await verifyMessage({ address: maintainer, message, signature });
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json(
      { error: "signature does not match the reward maintainer" },
      { status: 401 }
    );
  }

  // Don't let a manual edit stomp a reward that already settled/refunded on-chain.
  const terminal: UiStatus[] = ["Verifying", "Disputed", "Paid", "Rejected", "Refunded"];
  if (terminal.includes(stored.status)) {
    return NextResponse.json(
      { error: `reward is ${stored.status}; status is on-chain now` },
      { status: 409 }
    );
  }

  await setRewardStatus(id, status);
  return NextResponse.json({ ok: true, status });
}
