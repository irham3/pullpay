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
import type { Attestation, ContributorProfile } from "@/lib/types";

const REWARD_SETTLED = parseAbiItem(
  "event RewardSettled(bytes32 indexed id, address indexed contributor, uint256 amount, bytes32 attestationUID)"
);

// Real, on-chain contributor reputation: scans RewardSettled logs for this
// wallet (each carries the EAS attestation UID) and reads the reward records.
// No sample data — reflects actual paid contributions (PRD §27.4 / F10).
export function useContributorProfile(address: string) {
  const client = usePublicClient();

  return useQuery<ContributorProfile>({
    queryKey: ["contributor-profile", address, ESCROW_ADDRESS, client?.chain?.id],
    enabled: !DEMO_MODE && Boolean(client) && Boolean(address),
    queryFn: async () => {
      const empty: ContributorProfile = {
        address: address as Address,
        handle: "",
        totalEarned: 0,
        contributions: 0,
        reposCount: 0,
        attestations: [],
      };
      if (!client) return empty;

      const logs = await client.getLogs({
        address: ESCROW_ADDRESS,
        event: REWARD_SETTLED,
        args: { contributor: address as Address },
        fromBlock: DEPLOY_BLOCK,
        toBlock: "latest",
      });
      if (logs.length === 0) return empty;

      const ids = logs.map((l) => l.args.id as `0x${string}`);
      const records = await client.multicall({
        contracts: ids.map((id) => ({
          address: ESCROW_ADDRESS,
          abi: PULLPAY_ESCROW_ABI,
          functionName: "rewards" as const,
          args: [id],
        })),
        allowFailure: true,
      });

      // Block timestamps for each settle (for the date column).
      const blocks = await Promise.all(
        logs.map((l) =>
          l.blockNumber !== null
            ? client.getBlock({ blockNumber: l.blockNumber })
            : Promise.resolve(null)
        )
      );

      const attestations: Attestation[] = [];
      const repos = new Set<string>();
      let total = 0;

      records.forEach((res, i) => {
        if (res.status !== "success" || !res.result) return;
        const r = res.result as readonly unknown[];
        const repo = String(r[4]);
        const issueNumber = Number(r[5] as bigint);
        const amount = Number(formatUnits(r[2] as bigint, USDC_DECIMALS));
        repos.add(repo);
        total += amount;
        attestations.push({
          uid: (logs[i].args.attestationUID as `0x${string}`) ?? ("0x" as `0x${string}`),
          repo,
          issueNumber,
          amount,
          contributionType: "contribution",
          date: blocks[i] ? Number(blocks[i]!.timestamp) : 0,
          txHash: logs[i].transactionHash as `0x${string}`,
        });
      });

      attestations.sort((a, b) => b.date - a.date);

      return {
        address: address as Address,
        handle: "",
        totalEarned: total,
        contributions: attestations.length,
        reposCount: repos.size,
        attestations,
      };
    },
  });
}
