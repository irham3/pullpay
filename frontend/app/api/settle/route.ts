import { NextResponse } from "next/server";
import { isAddress, stringToHex, type Address } from "viem";
import {
  getRelayer,
  publicClient,
  escrow,
  readReward,
  readRewardMode,
} from "@/lib/server/relayer";
import { verifyMerge } from "@/lib/server/github";
import { getMapping } from "@/lib/server/store";
import { buildClaim } from "@/lib/rewardId";
import { DEMO_MODE } from "@/lib/contracts/addresses";

// POST /api/settle — called by pullpay.yml after a PR merges (PRD §8.3, §32).
// Re-verifies the merge via the GitHub API, resolves the contributor wallet,
// then settles Instant rewards directly or asserts Safeguarded rewards to UMA.
export async function POST(req: Request) {
  // Optional shared-secret gate for the workflow → relayer call.
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-pullpay-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    rewardId?: string;
    repo?: string;
    pr?: number | string;
    issue?: number | string;
    author?: string;
    contributor?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const rewardId = body.rewardId as `0x${string}` | undefined;
  const repo = body.repo;
  const pr = Number(body.pr);
  const issue = Number(body.issue);

  if (!rewardId || !/^0x[0-9a-fA-F]{64}$/.test(rewardId) || !repo || !pr) {
    return NextResponse.json(
      { error: "rewardId (bytes32), repo and pr are required" },
      { status: 400 }
    );
  }

  if (DEMO_MODE) {
    return NextResponse.json(
      { error: "no escrow deployed — set NEXT_PUBLIC_ESCROW_ADDRESS" },
      { status: 503 }
    );
  }

  const relayer = getRelayer();
  if (!relayer) {
    return NextResponse.json(
      { error: "relayer not configured (RELAYER_PRIVATE_KEY)" },
      { status: 503 }
    );
  }

  // 1) Re-verify the merge server-side.
  let merge;
  try {
    merge = await verifyMerge(repo, pr);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "merge verification failed" },
      { status: 502 }
    );
  }
  if (!merge.merged) {
    return NextResponse.json({ error: "PR is not merged" }, { status: 409 });
  }

  // 2) The reward must be live and Funded.
  const reward = await readReward(rewardId);
  if (reward.status !== 1) {
    return NextResponse.json(
      { error: `reward not in Funded state (status ${reward.status})` },
      { status: 409 }
    );
  }

  // 3) Resolve the contributor wallet: explicit override, else GitHub mapping.
  let contributor = (body.contributor as Address) || undefined;
  if (!contributor || !isAddress(contributor)) {
    const handle = body.author || merge.author;
    const mapped = handle ? await getMapping(handle) : null;
    if (!mapped) {
      return NextResponse.json(
        {
          error: "no wallet mapped for the PR author",
          hint: "contributor must link GitHub → wallet at /api/link, or times out to refund",
        },
        { status: 422 }
      );
    }
    contributor = mapped as Address;
  }

  // 4) Settle by mode.
  const mode = await readRewardMode(rewardId);
  try {
    let txHash: `0x${string}`;
    let action: string;

    if (mode === 0) {
      // Instant: relayer settles directly after a verified merge.
      txHash = await relayer.wallet.writeContract({
        ...escrow,
        functionName: "settleInstant",
        args: [rewardId, contributor],
      });
      action = "settleInstant";
    } else {
      // Safeguarded: assert eligibility to UMA with the structured claim.
      const claim = buildClaim({
        pr,
        repo,
        issue,
        rewardId,
        contributor,
      });
      txHash = await relayer.wallet.writeContract({
        ...escrow,
        functionName: "assertMerge",
        args: [rewardId, contributor, stringToHex(claim)],
      });
      action = "assertMerge";
    }

    await publicClient.waitForTransactionReceipt({ hash: txHash });
    return NextResponse.json({ ok: true, action, txHash, contributor, mode });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message.split("\n")[0] : "settle failed" },
      { status: 500 }
    );
  }
}
