"use client";

import { useQuery } from "@tanstack/react-query";
import type { Bounty, StoredReward } from "@/lib/types";

// The unified reward feed for the board, contributor, and maintainer pages.
// The server indexes the chain (RewardCreated scan + status refresh) and merges
// in shared metadata + soft review status, so every visitor sees every reward —
// and the browser never runs eth_getLogs (public RPCs rejected the range).
export function useRewards() {
  const query = useQuery({
    queryKey: ["server-rewards"],
    refetchInterval: 20_000,
    queryFn: async (): Promise<Bounty[]> => {
      const res = await fetch("/api/rewards");
      if (!res.ok) return [];
      const data = await res.json();
      return ((data.rewards ?? []) as StoredReward[]).map((r) => ({ ...r }));
    },
  });
  return { rewards: query.data ?? [], isLoading: query.isLoading };
}
