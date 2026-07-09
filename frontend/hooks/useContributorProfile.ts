"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { DEMO_MODE } from "@/lib/contracts/addresses";
import type { ContributorProfile } from "@/lib/types";

// Real, on-chain contributor reputation, served by the server-side indexer
// (RewardSettled events + EAS attestation UIDs). The browser no longer scans
// logs itself — public RPCs rejected the block range and the scan broke the
// page for everyone (PRD §27.4 / F10).
export function useContributorProfile(address: string) {
  return useQuery<ContributorProfile>({
    queryKey: ["contributor-profile", address],
    enabled: !DEMO_MODE && Boolean(address),
    refetchInterval: 30_000,
    queryFn: async () => {
      const empty: ContributorProfile = {
        address: address as Address,
        handle: "",
        totalEarned: 0,
        contributions: 0,
        reposCount: 0,
        attestations: [],
      };
      const res = await fetch(`/api/profile/${address}`);
      if (!res.ok) return empty;
      const data = await res.json();
      return {
        ...empty,
        totalEarned: data.totalEarned ?? 0,
        contributions: data.contributions ?? 0,
        reposCount: data.reposCount ?? 0,
        attestations: data.attestations ?? [],
      };
    },
  });
}
