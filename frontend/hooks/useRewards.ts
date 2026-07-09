"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useOnchainRewards } from "./useOnchainRewards";
import { mergeUiStatus } from "@/lib/status";
import type { Bounty, StoredReward } from "@/lib/types";

// Shared reward list from the server KV store — the same data for every visitor,
// so a contributor sees rewards funded by any maintainer (not only ones created
// in their own browser, which was the old localStorage behaviour).
export function useServerRewards() {
  return useQuery({
    queryKey: ["server-rewards"],
    refetchInterval: 20_000,
    queryFn: async (): Promise<StoredReward[]> => {
      const res = await fetch("/api/rewards");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.rewards ?? []) as StoredReward[];
    },
  });
}

// The unified reward feed for the board, contributor, and maintainer pages.
// Server rewards supply shared metadata + soft status; the on-chain scan supplies
// authoritative amounts/status and surfaces any reward not yet persisted server
// side. Merged by id, with on-chain terminal states winning (see mergeUiStatus).
export function useRewards() {
  const { data: onchain = [], isLoading: onchainLoading } = useOnchainRewards();
  const { data: server = [], isLoading: serverLoading } = useServerRewards();

  const rewards = React.useMemo<Bounty[]>(() => {
    const byId = new Map<string, Bounty>();
    for (const s of server) byId.set(s.id.toLowerCase(), { ...s });
    for (const o of onchain) {
      const key = o.id.toLowerCase();
      const s = byId.get(key);
      if (s) {
        byId.set(key, {
          ...s,
          amount: o.amount,
          bond: o.bond,
          maintainer: o.maintainer,
          contributor: o.contributor ?? s.contributor,
          deadline: o.deadline,
          mode: o.mode,
          status: mergeUiStatus(o.status, s.status),
        });
      } else {
        byId.set(key, o);
      }
    }
    return Array.from(byId.values());
  }, [onchain, server]);

  return { rewards, isLoading: onchainLoading || serverLoading };
}
