import "server-only";
import { isAddress, stringToHex, type Address } from "viem";
import {
  getRelayer,
  publicClient,
  escrow,
  readReward,
  readRewardMode,
} from "./relayer";
import { verifyMerge, closingIssue } from "./github";
import { getMapping } from "./store";
import { buildClaim } from "@/lib/rewardId";
import { DEMO_MODE } from "@/lib/contracts/addresses";

export interface SettleInput {
  rewardId: `0x${string}`;
  repo: string;
  pr: number;
  issue: number;
  /**
   * Contributor wallet override. Only honoured when `trusted` is set by the
   * caller (webhook with verified HMAC / API call with the shared secret).
   * Untrusted callers always pay the PR author's own verified mapping —
   * otherwise anyone could redirect a payout to an arbitrary address.
   */
  contributor?: string;
  trusted?: boolean;
}

export interface SettleResult {
  status: number;
  body: Record<string, unknown>;
}

// Shared settlement: verify the merge on GitHub, resolve the contributor wallet,
// then settle Instant directly or assert Safeguarded to UMA. Used by both the
// pullpay.yml relayer endpoint and the GitHub App webhook.
export async function settleReward(input: SettleInput): Promise<SettleResult> {
  const { rewardId, repo, pr, issue } = input;

  if (!rewardId || !/^0x[0-9a-fA-F]{64}$/.test(rewardId) || !repo || !pr) {
    return { status: 400, body: { error: "rewardId, repo and pr are required" } };
  }
  if (DEMO_MODE) {
    return { status: 503, body: { error: "no escrow deployed" } };
  }
  const relayer = getRelayer();
  if (!relayer) {
    return { status: 503, body: { error: "relayer not configured" } };
  }

  // 1) Re-verify the merge server-side (never trust the trigger alone).
  let merge;
  try {
    merge = await verifyMerge(repo, pr);
  } catch (e) {
    return {
      status: 502,
      body: { error: e instanceof Error ? e.message : "merge verification failed" },
    };
  }
  if (!merge.merged) {
    return { status: 409, body: { error: "PR is not merged" } };
  }
  if (!merge.intoDefaultBranch) {
    return {
      status: 409,
      body: {
        error: "PR was not merged into the default branch",
        hint: "only merges into the default branch trigger payout",
      },
    };
  }
  // The PR must declare it closes the funded issue ("closes #N"). Without this,
  // any merged PR in the repo (e.g. a typo fix) could claim any reward there.
  const linked = closingIssue(`${merge.title}\n${merge.body}`);
  if (linked !== issue) {
    return {
      status: 409,
      body: {
        error: `PR does not close issue #${issue}`,
        hint: `add "closes #${issue}" to the PR description, then retry`,
      },
    };
  }

  // 2) Reward must be Funded, for this exact repo + issue.
  const reward = await readReward(rewardId);
  if (reward.status !== 1) {
    return {
      status: 409,
      body: { error: `reward not Funded (status ${reward.status})` },
    };
  }
  if (
    reward.repo.toLowerCase() !== repo.toLowerCase() ||
    Number(reward.issueNumber) !== issue
  ) {
    return {
      status: 409,
      body: { error: "rewardId does not match repo/issue on-chain" },
    };
  }

  // 3) Resolve the contributor wallet. The author is taken from the GitHub API
  // (merge.author) — never from the request — so the payout target can only be
  // the wallet the real PR author verified for themselves.
  let contributor: Address | undefined =
    input.trusted && input.contributor && isAddress(input.contributor)
      ? (input.contributor as Address)
      : undefined;
  if (!contributor) {
    const mapped = merge.author ? await getMapping(merge.author) : null;
    if (!mapped) {
      return {
        status: 422,
        body: {
          error: "no wallet mapped for the PR author",
          hint: "contributor must link GitHub → wallet, or it times out to refund",
        },
      };
    }
    contributor = mapped as Address;
  }

  // 4) Settle by mode.
  const mode = await readRewardMode(rewardId);
  try {
    let txHash: `0x${string}`;
    let action: string;
    if (mode === 0) {
      txHash = await relayer.wallet.writeContract({
        ...escrow,
        functionName: "settleInstant",
        args: [rewardId, contributor],
      });
      action = "settleInstant";
    } else {
      const claim = buildClaim({ pr, repo, issue, rewardId, contributor });
      txHash = await relayer.wallet.writeContract({
        ...escrow,
        functionName: "assertMerge",
        args: [rewardId, contributor, stringToHex(claim)],
      });
      action = "assertMerge";
    }
    await publicClient.waitForTransactionReceipt({ hash: txHash });
    return {
      status: 200,
      body: { ok: true, action, txHash, contributor, mode },
    };
  } catch (e) {
    return {
      status: 500,
      body: { error: e instanceof Error ? e.message.split("\n")[0] : "settle failed" },
    };
  }
}
