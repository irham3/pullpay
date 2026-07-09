import "server-only";
import { parseAbiItem, formatUnits, type Address } from "viem";
import { publicClient, escrow, parseFullRecord } from "./relayer";
import {
  saveReward,
  getStoredReward,
  listStoredRewards,
  getLastScannedBlock,
  setLastScannedBlock,
  getLastSyncTs,
  setLastSyncTs,
  addSettledPayout,
} from "./store";
import { fetchIssue } from "./github";
import {
  ESCROW_ADDRESS,
  USDC_DECIMALS,
  DEPLOY_BLOCK,
  DEMO_MODE,
} from "@/lib/contracts/addresses";
import { CONTRACT_STATUS, contractStatusToUi, mergeUiStatus } from "@/lib/status";
import type { StoredReward } from "@/lib/types";

const ZERO = "0x0000000000000000000000000000000000000000";

const REWARD_CREATED = parseAbiItem(
  "event RewardCreated(bytes32 indexed id, address indexed maintainer, uint256 amount)"
);
const REWARD_SETTLED = parseAbiItem(
  "event RewardSettled(bytes32 indexed id, address indexed contributor, uint256 amount, bytes32 attestationUID)"
);

// Public RPCs cap eth_getLogs ranges, so scan in bounded windows. The browser
// used to run this scan itself against the wallet RPC and regularly hit
// "no backend is currently healthy" — the indexer now runs server-side against
// the (configurable) relayer RPC and persists progress, so a transient RPC
// failure just resumes on the next sync instead of blanking the board.
const STEP = 9_000n;
// Cap the work per sync so one API request never scans an unbounded backlog;
// the cursor persists, so repeated polls converge to the chain head.
const MAX_CHUNKS_PER_SYNC = 40;
const SYNC_MIN_INTERVAL_S = 15;

// Pull an on-chain reward into the shared store. GitHub is queried (best-effort)
// for the real title/labels — never trusted from a client — and financial fields
// always come from the chain.
export async function ingestReward(id: `0x${string}`): Promise<StoredReward | null> {
  const r = parseFullRecord(
    (await publicClient.readContract({
      ...escrow,
      functionName: "rewards",
      args: [id],
    })) as readonly unknown[]
  );
  if (r.maintainer === ZERO) return null; // never created

  const existing = await getStoredReward(id);
  const contractStatus = CONTRACT_STATUS[r.status] ?? "Funded";
  const onchainUi = contractStatusToUi(contractStatus);

  // GitHub metadata: keep what we already stored; fetch once for new rewards.
  let issueTitle = existing?.issueTitle;
  let labels = existing?.labels;
  let language = existing?.language;
  if (!existing) {
    try {
      const info = await fetchIssue(r.repo, Number(r.issueNumber));
      issueTitle = info.title || undefined;
      labels = info.labels;
      language = info.language || undefined;
    } catch {
      // Board falls back to "repo #issue" until GitHub is reachable.
    }
  }

  const record: StoredReward = {
    id,
    repo: r.repo,
    issueNumber: Number(r.issueNumber),
    issueTitle: issueTitle || `${r.repo} #${Number(r.issueNumber)}`,
    amount: Number(formatUnits(r.amount, USDC_DECIMALS)),
    bond: Number(formatUnits(r.bond, USDC_DECIMALS)),
    token: "USDC",
    maintainer: r.maintainer,
    contributor: r.contributor !== ZERO ? r.contributor : existing?.contributor,
    contributorHandle: existing?.contributorHandle,
    mode: r.mode === 0 ? "Instant" : "Safeguarded",
    // On-chain terminal states win; while Funded, keep the soft review status.
    status: mergeUiStatus(onchainUi, existing?.status),
    deadline: Number(r.deadline),
    createdAt: existing?.createdAt ?? Math.floor(Date.now() / 1000),
    language: language || "TypeScript",
    labels: labels ?? [],
    fundingTx: existing?.fundingTx ?? ("0x" as `0x${string}`),
    prNumber: existing?.prNumber,
  };
  await saveReward(record);
  return record;
}

async function recordSettledLog(log: {
  args: { id?: `0x${string}`; contributor?: Address; amount?: bigint; attestationUID?: `0x${string}` };
  transactionHash: `0x${string}` | null;
  blockNumber: bigint | null;
}): Promise<void> {
  const { id, contributor, amount, attestationUID } = log.args;
  if (!id || !contributor) return;
  const stored = await getStoredReward(id);
  let date = 0;
  try {
    if (log.blockNumber !== null) {
      const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
      date = Number(block.timestamp);
    }
  } catch {
    // best-effort timestamp
  }
  await addSettledPayout(contributor, {
    rewardId: id,
    repo: stored?.repo ?? "unknown/repo",
    issueNumber: stored?.issueNumber ?? 0,
    amount: Number(formatUnits(amount ?? 0n, USDC_DECIMALS)),
    attestationUID: attestationUID ?? ("0x" as `0x${string}`),
    txHash: log.transactionHash ?? ("0x" as `0x${string}`),
    date,
  });
}

// Refresh statuses of already-stored rewards straight from contract state.
// Settlement/refund can happen in blocks we already scanned past (status changes
// emit no RewardCreated), so a multicall over known ids is the reliable way.
async function refreshStoredStatuses(): Promise<void> {
  const stored = await listStoredRewards();
  if (stored.length === 0) return;
  const results = await publicClient.multicall({
    contracts: stored.map((s) => ({
      address: ESCROW_ADDRESS,
      abi: escrow.abi,
      functionName: "rewards" as const,
      args: [s.id],
    })),
    allowFailure: true,
  });
  for (let i = 0; i < stored.length; i++) {
    const res = results[i];
    if (res.status !== "success" || !res.result) continue;
    const r = parseFullRecord(res.result as readonly unknown[]);
    if (r.maintainer === ZERO) continue;
    const onchainUi = contractStatusToUi(CONTRACT_STATUS[r.status] ?? "Funded");
    const next = mergeUiStatus(onchainUi, stored[i].status);
    const contributor = r.contributor !== ZERO ? r.contributor : stored[i].contributor;
    if (next !== stored[i].status || contributor !== stored[i].contributor) {
      await saveReward({ ...stored[i], status: next, contributor });
    }
  }
}

// Incremental chain sync: discover new rewards + settled payouts since the last
// scanned block, then refresh statuses of known rewards. Throttled so concurrent
// page loads don't stampede the RPC.
export async function syncRewards(): Promise<void> {
  if (DEMO_MODE) return;

  const now = Math.floor(Date.now() / 1000);
  const lastTs = await getLastSyncTs();
  if (lastTs && now - lastTs < SYNC_MIN_INTERVAL_S) return;
  await setLastSyncTs(now);

  const latest = await publicClient.getBlockNumber();
  let from = (await getLastScannedBlock()) ?? DEPLOY_BLOCK;
  if (from > latest) return;

  let chunks = 0;
  while (from <= latest && chunks < MAX_CHUNKS_PER_SYNC) {
    const to = from + STEP > latest ? latest : from + STEP;
    const [created, settled] = await Promise.all([
      publicClient.getLogs({
        address: ESCROW_ADDRESS,
        event: REWARD_CREATED,
        fromBlock: from,
        toBlock: to,
      }),
      publicClient.getLogs({
        address: ESCROW_ADDRESS,
        event: REWARD_SETTLED,
        fromBlock: from,
        toBlock: to,
      }),
    ]);
    for (const log of created) {
      const id = log.args.id as `0x${string}` | undefined;
      if (id) await ingestReward(id);
    }
    for (const log of settled) {
      await recordSettledLog(log);
    }
    // Persist progress after each window so a mid-scan RPC failure resumes here.
    await setLastScannedBlock(to + 1n);
    from = to + 1n;
    chunks++;
  }

  await refreshStoredStatuses();
}
