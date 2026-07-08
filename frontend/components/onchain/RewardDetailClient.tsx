"use client";

import Link from "next/link";
import { useBounty } from "@/hooks/useBounty";
import { RewardDetailView } from "./RewardDetailView";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

// Loads a reward not present in the demo mock: from the local created-cache or
// live on-chain (getReward / rewards). Used for real, freshly-created rewards.
export function RewardDetailClient({ id }: { id: `0x${string}` }) {
  const { bounty, assertionId, isLoading } = useBounty(id);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-6 h-8 w-2/3" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!bounty) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <span className="font-mono text-sm text-muted">404</span>
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          Reward not found
        </h1>
        <p className="max-w-xs text-sm text-muted">
          No reward with this id exists on-chain or in this browser.
        </p>
        <Button asChild>
          <Link href="/bounties">Browse rewards</Link>
        </Button>
      </main>
    );
  }

  return <RewardDetailView bounty={bounty} assertionId={assertionId} />;
}
