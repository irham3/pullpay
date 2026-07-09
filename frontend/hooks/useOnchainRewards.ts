"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { parseAbiItem, formatUnits, type Address } from "viem";
import { PULLPAY_ESCROW_ABI } from "@/lib/contracts/PullPayEscrow";
import {
  ESCROW_ADDRESS,
  USDC_DECIMALS,
  DEMO_MODE,
  DEPLOY_BLOCK,
} from "@/lib/contracts/addresses";
import { CONTRACT_STATUS, contractStatusToUi } from "@/lib/status";
import type { Bounty, Mode } from "@/lib/types";
import { loadLocalRewards } from "@/lib/localStore";

const ZERO = "0x0000000000000000000000000000000000000000";
const REWARD_CREATED = parseAbiItem(
  "event RewardCreated(bytes32 indexed id, address indexed maintainer, uint256 amount)"
);

// Lightweight on-chain indexer: scans RewardCreated logs from the deploy block
// and reads each record, so the board reflects real rewards without a subgraph
// (PRD §27.3 leaves indexing to a subgraph; this is the MVP stand-in).
export function useOnchainRewards() {
  const client = usePublicClient();

  return useQuery({
    queryKey: ["onchain-rewards", ESCROW_ADDRESS, client?.chain?.id],
    enabled: !DEMO_MODE && Boolean(client),
    refetchInterval: 20_000,
    queryFn: async (): Promise<Bounty[]> => {
      if (!client) return [];
      const idSet = new Set<`0x${string}`>();
      try {
        // Public RPCs cap eth_getLogs to a bounded block range, so a single
        // DEPLOY_BLOCK→latest scan silently throws and the board falls back to an
        // empty on-chain list (which made rewards from other maintainers vanish).
        // Page through in fixed windows so every reward is indexed regardless of
        // how far the chain has advanced past the deploy block.
        const latest = await client.getBlockNumber();
        const STEP = 9_000n;
        for (let from = DEPLOY_BLOCK; from <= latest; from += STEP + 1n) {
          const to = from + STEP > latest ? latest : from + STEP;
          const chunk = await client.getLogs({
            address: ESCROW_ADDRESS,
            event: REWARD_CREATED,
            fromBlock: from,
            toBlock: to,
          });
          for (const l of chunk) idSet.add(l.args.id as `0x${string}`);
        }
      } catch (err) {
        console.error("useOnchainRewards getLogs error:", err);
      }
      const ids = Array.from(idSet);
      if (ids.length === 0) return [];

      const records = await client.multicall({
        contracts: ids.map((id) => ({
          address: ESCROW_ADDRESS,
          abi: PULLPAY_ESCROW_ABI,
          functionName: "rewards" as const,
          args: [id],
        })),
        allowFailure: true,
      });

      const local = loadLocalRewards();
      const now = Math.floor(Date.now() / 1000);

      const bounties: Bounty[] = [];
      records.forEach((res, i) => {
        if (res.status !== "success" || !res.result) return;
        const r = res.result as readonly [
          Address, Address, bigint, bigint, string, bigint,
          `0x${string}`, number, bigint, `0x${string}`, Address, number
        ];
        if (r[0] === ZERO) return; // never created
        const id = ids[i];
        const meta = local.find((b) => b.id.toLowerCase() === id.toLowerCase());
        const contractStatus = CONTRACT_STATUS[r[11]] ?? "Funded";
        bounties.push({
          id,
          repo: r[4] || meta?.repo || "unknown/repo",
          issueNumber: Number(r[5]),
          issueTitle: meta?.issueTitle || `${r[4]} #${Number(r[5])}`,
          amount: Number(formatUnits(r[2], USDC_DECIMALS)),
          bond: Number(formatUnits(r[3], USDC_DECIMALS)),
          token: "USDC",
          maintainer: r[0],
          contributor: r[10] !== ZERO ? r[10] : undefined,
          contributorHandle: meta?.contributorHandle,
          mode: (r[7] === 0 ? "Instant" : "Safeguarded") as Mode,
          status: contractStatusToUi(contractStatus),
          deadline: Number(r[8]),
          createdAt: meta?.createdAt ?? now,
          language: meta?.language || "TypeScript",
          labels: meta?.labels || [],
          fundingTx: meta?.fundingTx || ("0x" as `0x${string}`),
          prNumber: meta?.prNumber,
        });
      });
      return bounties;
    },
  });
}
