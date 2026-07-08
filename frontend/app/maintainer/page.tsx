"use client";

import * as React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { loadLocalRewards } from "@/lib/localStore";
import { useOnchainRewards } from "@/hooks/useOnchainRewards";
import { useUsdcBalance } from "@/hooks/usePullPay";
import { USDC_DECIMALS, DEMO_MODE } from "@/lib/contracts/addresses";
import type { Bounty } from "@/lib/types";
import { BountyCard } from "@/components/bounty/BountyCard";
import { StatCard } from "@/components/onchain/StatCard";
import { Button } from "@/components/ui/Button";
import { ConnectButton } from "@/components/layout/ConnectButton";
import { RoleTabs } from "@/components/layout/RoleTabs";

export default function MaintainerPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useUsdcBalance();
  const { data: onchain = [], isLoading } = useOnchainRewards();

  const [local, setLocal] = React.useState<Bounty[]>([]);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load local cache on mount
    setLocal(loadLocalRewards());
  }, []);

  const mine = React.useMemo(() => {
    if (!address) return [];
    const seen = new Set<string>();
    return [...onchain, ...local].filter((b) => {
      const key = b.id.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return b.maintainer.toLowerCase() === address.toLowerCase();
    });
  }, [onchain, local, address]);

  const totalFunded = mine.reduce((sum, b) => sum + b.amount, 0);
  const paidOut = mine
    .filter((b) => b.status === "Paid")
    .reduce((sum, b) => sum + b.amount, 0);
  const active = mine.filter((b) =>
    ["Open", "In Review", "Changes Requested", "Merged", "Verifying"].includes(
      b.status
    )
  ).length;

  if (!isConnected) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text">
          Maintainer
        </h1>
        <p className="max-w-sm text-sm text-muted">
          Connect your wallet to create rewards and manage payouts.
        </p>
        <ConnectButton />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <RoleTabs />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Maintainer dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            Rewards you funded. Connect the repo, merge a PR, then trigger the
            payout.
          </p>
        </div>
        <Button asChild>
          <Link href="/create">Create reward</Link>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="USDC balance">
          {balance !== undefined
            ? Number(formatUnits(balance, USDC_DECIMALS)).toLocaleString("en-US")
            : DEMO_MODE
              ? "-"
              : "0"}
        </StatCard>
        <StatCard label="Locked">${totalFunded.toLocaleString("en-US")}</StatCard>
        <StatCard label="Paid">${paidOut.toLocaleString("en-US")}</StatCard>
        <StatCard label="Active">{active}</StatCard>
      </div>

      <div className="mt-8">
        {isLoading && mine.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border p-12 text-center text-sm text-muted">
            Loading your rewards...
          </div>
        ) : mine.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-border p-12 text-center">
            <p className="text-sm text-text">No rewards funded yet.</p>
            <p className="mt-1 text-sm text-muted">
              Create one reward for an open GitHub issue.
            </p>
            <Button asChild className="mt-4">
              <Link href="/create">Create your first reward</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((b) => (
              <BountyCard
                key={b.id}
                repoName={b.repo}
                issueTitle={b.issueTitle}
                bountyAmount={b.amount}
                walletAddress={b.contributor ?? b.maintainer}
                issueNumber={b.issueNumber}
                labels={[b.language, ...b.labels]}
                mode={b.mode}
                status={b.status}
                href={`/reward/${b.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
